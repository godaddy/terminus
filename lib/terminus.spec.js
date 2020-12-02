'use strict'
const http = require('http')
const { execFile, spawnSync } = require('child_process')

const expect = require('chai').expect
const fetch = require('node-fetch')

const { createTerminus } = require('./terminus')
const { HealthCheckError } = require('./terminus-error')

describe('Terminus', () => {
  let server

  beforeEach(() => {
    server = http.createServer((req, res) => res.end('hello'))
  })

  afterEach(() => {
    server.close()
  })

  describe('supports onHealthcheck for the healthcheck route', () => {
    it('but keeps all the other endpoints', async () => {
      createTerminus(server, {})
      server.listen(8000)

      const response = await fetch('http://localhost:8000')
      const text = await response.text()
      expect(text).to.eql('hello')
    })

    it('returns 200 on resolve', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true
            return Promise.resolve()
          }
        }
      })
      server.listen(8000)

      const response = await fetch('http://localhost:8000/health')
      expect(response.status).to.eql(200)
      expect(response.headers.has('Content-Type')).to.eql(true)
      expect(response.headers.get('Content-Type')).to.eql('application/json')
      expect(onHealthCheckRan).to.eql(true)
    })

    it('case sensitive by default', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/HeAlTh': () => {
            onHealthCheckRan = true
            return Promise.resolve()
          }
        }
      })
      server.listen(8000)

      await fetch('http://localhost:8000/health')
      expect(onHealthCheckRan).to.eql(false)
    })

    it('case insensitive opt-in', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/HeAlTh': () => {
            onHealthCheckRan = true
            return Promise.resolve()
          }
        },
        caseInsensitive: true
      })
      server.listen(8000)

      await fetch('http://localhost:8000/health')
      expect(onHealthCheckRan).to.eql(true)
    })

    it('case insensitive opt-in - should working with original path', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/healthCheck': () => {
            onHealthCheckRan = true
            return Promise.resolve()
          }
        },
        caseInsensitive: true
      })
      server.listen(8000)

      await fetch('http://localhost:8000/healthCheck')
      expect(onHealthCheckRan).to.eql(true)
    })

    it('do not send multiple responses for the same request', async () => {
      let healthCheckRanTimes = 0
      let hasHandlerCalled = false
      let hasUnhandledRejection = false

      process.once('unhandledRejection', () => {
        hasUnhandledRejection = true
      })

      server.on('request', () => {
        hasHandlerCalled = true
      })

      createTerminus(server, {
        healthChecks: {
          '/healthCheck': () => {
            healthCheckRanTimes++
            return Promise.resolve()
          }
        }
      })
      server.listen(8000)

      await fetch('http://localhost:8000/healthCheck')
      expect(hasUnhandledRejection).to.eql(false)
      expect(healthCheckRanTimes).to.eql(1)
      expect(hasHandlerCalled).to.eql(false)
    })

    it('includes info on resolve', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true
            return Promise.resolve({
              version: '1.0.0'
            })
          }
        }
      })
      server.listen(8000)

      const res = await fetch('http://localhost:8000/health')
      expect(res.status).to.eql(200)
      expect(res.headers.has('Content-Type')).to.eql(true)
      expect(res.headers.get('Content-Type')).to.eql('application/json')
      expect(onHealthCheckRan).to.eql(true)
      const json = await res.json()
      expect(json).to.deep.eql({
        status: 'ok',
        info: {
          version: '1.0.0'
        },
        details: {
          version: '1.0.0'
        }
      })
    })

    it('includes verbatim on resolve', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true
            return Promise.resolve({
              version: '1.0.0'
            })
          },
          verbatim: true
        }
      })
      server.listen(8000)

      const res = await fetch('http://localhost:8000/health')
      expect(res.status).to.eql(200)
      expect(res.headers.has('Content-Type')).to.eql(true)
      expect(res.headers.get('Content-Type')).to.eql('application/json')
      expect(onHealthCheckRan).to.eql(true)
      const json = await res.json()
      expect(json).to.deep.eql({
        status: 'ok',
        version: '1.0.0'
      })
    })

    it('returns 503 on reject', async () => {
      let onHealthCheckRan = false
      let loggerRan = false

      createTerminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true
            return Promise.reject(new Error('failed'))
          }
        },
        logger: () => {
          loggerRan = true
        }
      })
      server.listen(8000)

      const res = await fetch('http://localhost:8000/health')
      expect(res.status).to.eql(503)
      expect(onHealthCheckRan).to.eql(true)
      expect(loggerRan).to.eql(true)
    })

    it('includes error on reject', async () => {
      let onHealthCheckRan = false

      createTerminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true
            const myError = new HealthCheckError('failed', {
              fornite: 'client down',
              redis: {
                disk: 100
              }
            })
            return Promise.reject(myError)
          }
        }
      })
      server.listen(8000)

      const res = await fetch('http://localhost:8000/health')
      expect(res.status).to.eql(503)
      expect(onHealthCheckRan).to.eql(true)
      const json = await res.json()
      expect(json).to.deep.eql({
        status: 'error',
        error: {
          fornite: 'client down',
          redis: {
            disk: 100
          }
        },
        details: {
          fornite: 'client down',
          redis: {
            disk: 100
          }
        }
      })
    })

    it('returns 503 once signal received', (done) => {
      let responseAssertionsComplete = false

      // We're only truly finished when the response has been analyzed and the forked http process has exited,
      // freeing up port 8000 for future tests
      execFile('node', ['lib/standalone-tests/terminus.onsignal.fail.js'], (error) => {
        expect(error.signal).to.eql('SIGINT')
        expect(responseAssertionsComplete).to.eql(true)
        done()
      })

      // let the process start up
      setTimeout(() => {
        fetch('http://localhost:8000/health')
          .then(res => {
            expect(res.status).to.eql(503)
            responseAssertionsComplete = true
          })
      }, 300)
    })

    it('calls onSendFailureDuringShutdown when sending 503 during shutdown', (done) => {
      let responseAssertionsComplete = false

      // We're only truly finished when the response has been analyzed and the forked http process has exited,
      // freeing up port 8000 for future tests
      execFile('node', ['lib/standalone-tests/terminus.onsendfailureduringshutdown.js'],
        (error, stdout) => {
          expect(error.signal).to.eql('SIGTERM')
          expect(stdout).to.eql('onSendFailureDuringShutdown\n')
          expect(responseAssertionsComplete).to.eql(true)
          done()
        })

      // let the process start up
      setTimeout(() => {
        fetch('http://localhost:8000/health')
          .then(res => {
            expect(res.status).to.eql(503)
            responseAssertionsComplete = true
          })
      }, 300)
    })

    it('does NOT call onSendFailureDuringShutdown when sending 503 during failed healthcheck', (done) => {
      let responseAssertionsComplete = false

      // We're only truly finished when the response has been analyzed and the forked http process has exited,
      // freeing up port 8000 for future tests
      execFile('node', ['lib/standalone-tests/terminus.onsendfailureduringshutdown.failed-health.js'],
        (error, stdout) => {
          expect(error.signal).to.eql('SIGTERM')
          // Here, we expect NOT to see "onSendFailureDuringShutdown"
          expect(stdout).to.eql('')
          expect(responseAssertionsComplete).to.eql(true)
          done()
        })

      // let the process start up
      setTimeout(() => {
        fetch('http://localhost:8000/health')
          .then(res => {
            expect(res.status).to.eql(503)
            responseAssertionsComplete = true
          })
      }, 300)
    })
  })

  it('runs onSignal when getting the SIGTERM signal', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onsigterm.js'])
    expect(result.stdout.toString().trim()).to.eql('on-sigterm-runs')
  })

  it('runs onShutdown after SIGTERM onSignal', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onshutdown.sigterm.js'])
    expect(result.stdout.toString().trim()).to.eql('on-sigterm-runs\non-shutdown-runs')
  })

  it('runs onSignal when getting SIGINT signal', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onsigint.js'])
    expect(result.stdout.toString().trim()).to.eql('on-sigint-runs')
  })

  it('runs onShutdown after SIGINT onSignal', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onshutdown.sigint.js'])
    expect(result.stdout.toString().trim()).to.eql('on-sigint-runs\non-shutdown-runs')
  })

  it('runs onSignal when getting SIGUSR2 signal', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onsigusr2.js'])
    expect(result.stdout.toString().trim()).to.eql('on-sigusr2-runs')
  })

  it('runs onShutdown after SIGUSR2 onSignal', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onshutdown.sigusr2.js'])
    expect(result.stdout.toString().trim()).to.eql('on-sigusr2-runs\non-shutdown-runs')
  })

  it('runs onSignal when killed with SIGTERM and multiple signals are listened for', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onmultiple.js', 'SIGTERM'])
    expect(result.stdout.toString().trim()).to.eql('on-sigterm-runs')
  })

  it('runs onSignal when killed with SIGINT and multiple signals are listened for', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onmultiple.js', 'SIGINT'])
    expect(result.stdout.toString().trim()).to.eql('on-sigint-runs')
  })

  it('runs onSignal when killed with SIGUSR2 and multiple signals are listened for', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onmultiple.js', 'SIGUSR2'])
    expect(result.stdout.toString().trim()).to.eql('on-sigusr2-runs')
  })

  it('runs onShutdown after onSignal when killed with SIGTERM and multiple signals are listened for', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onshutdown.multiple.js', 'SIGTERM'])
    expect(result.stdout.toString().trim()).to.eql('on-sigterm-runs\non-shutdown-runs')
  })

  it('runs onShutdown after onSignal when killed with SIGINT and multiple signals are listened for', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onshutdown.multiple.js', 'SIGINT'])
    expect(result.stdout.toString().trim()).to.eql('on-sigint-runs\non-shutdown-runs')
  })

  it('runs onShutdown after onSignal when killed with SIGUSR2 and multiple signals are listened for', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.onshutdown.multiple.js', 'SIGUSR2'])
    expect(result.stdout.toString().trim()).to.eql('on-sigusr2-runs\non-shutdown-runs')
  })

  it('manages multiple servers', () => {
    const result = spawnSync('node', ['lib/standalone-tests/terminus.multiserver.js'])
    expect(result.stdout.toString().trim()).to.eql([
      'server1:onSignal',
      'server2:onSignal',
      'server3:onSignal'
    ].join('\n'))
  })
})
