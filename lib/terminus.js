'use strict'

const stoppable = require('stoppable')
const {
  promisify
} = require('es6-promisify')
const { HealthCheckNotFoundError } = require('./errors/health-check-not-found-error')

function noopResolves() {
  return Promise.resolve()
}

function noop() { }

const DEFAULT_OPTIONS = {
  signal: 'SIGTERM',
  signals: [],
  timeout: 1000,
  healthChecks: {},
  onShutdown: noopResolves,
  beforeShutdown: noopResolves,
  onSendFailureDuringShutdown: noopResolves,
  logger: noop
}

class Terminus {
  constructor(server, options = {}) {
    this.server = server
    this.options = Object.assign(DEFAULT_OPTIONS, options)
    this.state = {
      isShuttingDown: false
    }

    this.onSignal = options.onSignal || options.onSigterm || noopResolves

    if (Object.keys(this.options.healthChecks).length > 0) {
      this._decorateWithHealthCheck()
    }

    // push the signal into the array
    // for backwards compatability
    if (!this.options.signals.includes(this.options.signal)) {
      this.options.signals.push(this.options.signal)
    }
    this._decorateWithSignalHandler()
  }

  async _cleanup(signal) {
    if (!this.state.isShuttingDown) {
      this.state.isShuttingDown = true
      try {
        await this.options.beforeShutdown()
        await this._asyncServerStop()
        await this.onSignal()
        await this.options.onShutdown()
        this.options.signals.forEach(sig => process.removeListener(sig, () => this._cleanup()))
        process.kill(process.pid, signal)
      } catch (error) {
        this.options.logger('error happened during shutdown', error)
        process.exit(1)
      }
    }
  }

  _sendSuccess(info) {
    const statusResponse = { status: 'ok' }
    if (info) {
      statusResponse.info = info
    }
    return statusResponse
  }

  _sendFailure(error) {
    return {
      status: 'error',
      error: error
    }
  }

  _executeHealtCheck(url) {
    return this.options.healthChecks[url]()
  }

  async _onRequest(req, res, listener) {
    let statusResponse

    try {
      statusResponse = await this.getHealthStatus(req.url)
    } catch (error) {
      listener(req, res)
    }

    res.setHeader('Content-Type', 'application/json')

    if (statusResponse.status === 'ok') {
      res.statusCode = 200
    } else {
      res.statusCode = 503
    }

    return res.end(JSON.stringify(statusResponse))
  }

  _decorateWithHealthCheck() {
    this.server.listeners('request')
      .forEach((listener) => {
        this.server.removeListener('request', listener)
        this.server.on('request', async (req, res) => this._onRequest(req, res, listener))
      })
  }

  _decorateWithSignalHandler() {
    stoppable(this.server, this.options.timeout)

    this._asyncServerStop = promisify(this.server.stop).bind(this.server)
    this.options.signals.forEach(
      sig => {
        process.on(sig, () => this._cleanup())
      }
    )
  }

  getHttpServer() {
    return this.server
  }
  async getHealthStatus(url) {
    if (this.options.healthChecks[url]) {
      if (this.state.isShuttingDown) {
        const healthRespose = this._sendFailure();
        if (healthRespose !== 'ok') {
          await this.options.onSendFailureDuringShutdown();
        }
        return healthRespose;
      }
      let info
      try {
        info = await this._executeHealtCheck(url)
      } catch (error) {
        this.options.logger('healthcheck failed', error)
        return this._sendFailure(error.causes)
      }
      return this._sendSuccess(info)
    } else {
      throw new HealthCheckNotFoundError('Given health check is not registered')
    }
  }
}

function createTerminus(server, options = {}) {
  return new Terminus(server, options)
}

module.exports.createTerminus = createTerminus
