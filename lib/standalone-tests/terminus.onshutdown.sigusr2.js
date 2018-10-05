'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { Terminus } = require('../../')
const SIGNAL = 'SIGUSR2'

// eslint-disable-next-line
new Terminus(server, {
  signal: SIGNAL,
  onSignal: () => {
    console.log('on-sigusr2-runs')
    return Promise.resolve()
  },
  onShutdown: () => {
    console.log('on-shutdown-runs')
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
