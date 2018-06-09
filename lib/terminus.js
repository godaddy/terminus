'use strict'

const stoppable = require('stoppable')
const { promisify } = require('es6-promisify')

const SUCCESS_RESPONSE = JSON.stringify({
  status: 'ok'
})

const FAILURE_RESPONSE = JSON.stringify({
  status: 'error'
})

function noopResolves () {
  return Promise.resolve()
}

function sendSuccess (res) {
  res.statusCode = 200
  res.end(SUCCESS_RESPONSE)
}

function sendFailure (res) {
  res.statusCode = 503
  res.end(FAILURE_RESPONSE)
}

const state = {
  isShuttingDown: false
}

function noop () {}

function decorateWithHealthCheck (server, options) {
  const { healthChecks, logger } = options

  server.listeners('request').forEach((listener) => {
    server.removeListener('request', listener)
    server.on('request', (req, res) => {
      if (healthChecks[req.url]) {
        if (state.isShuttingDown) {
          return sendFailure(res)
        }
        healthChecks[req.url]()
          .then(() => {
            sendSuccess(res)
          })
          .catch((error) => {
            logger('healthcheck failed', error)
            sendFailure(res)
          })
      } else {
        listener(req, res)
      }
    })
  })
}

function decorateWithSignalHandler (server, options) {
  const { signals, onSignal, beforeShutdown, onShutdown, timeout, logger } = options

  stoppable(server, timeout)

  const asyncServerStop = promisify(server.stop).bind(server)

  function cleanup (signal) {
    if(!state.isShuttingDown) {
      state.isShuttingDown = true
      beforeShutdown()
        .then(() => asyncServerStop())
        .then(() => onSignal())
        .then(() => onShutdown())
        .then(() => {
          signals.forEach(sig => process.removeListener(sig, cleanup))
          process.kill(process.pid, signal)
        })
        .catch((error) => {
          logger('error happened during shutdown', error)
          process.exit(1)
      })
    }
  }
  signals.forEach(
    sig => process.on(sig, sig => cleanup(sig))
  )
}

function terminus (server, options = {}) {
  const { signal='SIGTERM',
          signals = [],
          timeout=1000,
          healthChecks={},
          onShutdown=noopResolves,
          beforeShutdown=noopResolves,
          logger=noop } = options
  const onSignal = options.onSignal || options.onSigterm || noopResolves

  if (Object.keys(healthChecks).length > 0) {
    decorateWithHealthCheck(server, {
      healthChecks,
      logger
    })
  }

  // push the signal into the array
  // for backwards compatability
  if(!signals.includes(signal)) signals.push(signal);
  decorateWithSignalHandler(server, {
    signals,
    onSignal,
    beforeShutdown,
    onShutdown,
    timeout,
    logger
  })

  return server
}

module.exports = terminus
