'use strict'

const stoppable = require('stoppable')
const {
  promisify
} = require('es6-promisify')
const { HealthCheckNotFoundError } = require('./terminus-error')

function noopResolves () {
  return Promise.resolve()
}

function noop () { }

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
  constructor (server, options = {}) {
    this._server = server
    this._options = Object.assign(DEFAULT_OPTIONS, options)
    this._state = {
      isShuttingDown: false
    }

    this._onSignal = options.onSignal || options.onSigterm || noopResolves

    if (Object.keys(this._options.healthChecks).length > 0) {
      this._decorateWithHealthCheck()
    }

    // push the signal into the array
    // for backwards compatability
    if (!this._options.signals.includes(this._options.signal)) {
      this._options.signals.push(this._options.signal)
    }
    this._decorateWithSignalHandler()
  }

  async _cleanup (signal) {
    if (!this._state.isShuttingDown) {
      this._state.isShuttingDown = true
      try {
        await this._options.beforeShutdown()
        await this._asyncServerStop()
        await this._onSignal()
        await this._options.onShutdown()
        this._options.signals.forEach(sig => process.removeListener(sig, () => this._cleanup()))
        process.kill(process.pid, signal)
      } catch (error) {
        this._options.logger('error happened during shutdown', error)
        process.exit(1)
      }
    }
  }

  _sendSuccess (info) {
    const statusResponse = { status: 'ok' }
    if (info) {
      statusResponse.info = info
    }
    return statusResponse
  }

  _sendFailure (error) {
    return {
      status: 'error',
      error: error
    }
  }

  _executeHealtCheck (url) {
    return this._options.healthChecks[url]()
  }

  async _onRequest (req, res, listener) {
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

  _decorateWithHealthCheck () {
    this._server.listeners('request')
      .forEach((listener) => {
        this._server.removeListener('request', listener)
        this._server.on('request', async (req, res) => this._onRequest(req, res, listener))
      })
  }

  _decorateWithSignalHandler () {
    stoppable(this._server, this._options.timeout)

    this._asyncServerStop = promisify(this._server.stop).bind(this._server)
    this._options.signals.forEach(
      sig => {
        process.on(sig, () => this._cleanup())
      }
    )
  }

  getHttpServer () {
    return this._server
  }
  async getHealthStatus (url) {
    if (this._options.healthChecks[url]) {
      if (this._state.isShuttingDown) {
        const healthRespose = this._sendFailure()
        if (healthRespose !== 'ok') {
          await this._options.onSendFailureDuringShutdown()
        }
        return healthRespose
      }
      let info
      try {
        info = await this._executeHealtCheck(url)
      } catch (error) {
        this._options.logger('healthcheck failed', error)
        return this._sendFailure(error.causes || [error.message])
      }
      return this._sendSuccess(info)
    } else {
      throw new HealthCheckNotFoundError('Given health check is not registered')
    }
  }
}

module.exports.Terminus = Terminus
