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

async function sendSuccess (res, options) {
  const { info } = options

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  if (info) {
    return res.end(JSON.stringify({
      status: 'ok',
      info: info
    }))
  }
  res.end(SUCCESS_RESPONSE)
}

async function sendFailure (res, options) {
  const { error, onSendFailureDuringShutdown } = options

  if (onSendFailureDuringShutdown) {
    await onSendFailureDuringShutdown()
  }
  res.statusCode = 503
  res.setHeader('Content-Type', 'application/json')
  if (error) {
    return res.end(JSON.stringify({
      status: 'error',
      error: error
    }))
  }
  res.end(FAILURE_RESPONSE)
}

const intialState = {
  isShuttingDown: false
}

function noop () {}

function decorateWithHealthCheck (server, state, options) {
  const { healthChecks, logger, onSendFailureDuringShutdown } = options

  server.listeners('request').forEach((listener) => {
    server.removeListener('request', listener)
    server.on('request', async (req, res) => {
      if (healthChecks[req.url]) {
        if (state.isShuttingDown) {
          return sendFailure(res, { onSendFailureDuringShutdown })
        }
        let info
        try {
          info = await healthChecks[req.url]()
        } catch (error) {
          logger('healthcheck failed', error)
          return sendFailure(res, { error: error.causes })
        }
        return sendSuccess(res, { info })
      } else {
        listener(req, res)
      }
    })
  })
}

function decorateWithSignalHandler (server, state, options) {
  const { signals, onSignal, beforeShutdown, onShutdown, timeout, logger } = options

  stoppable(server, timeout)

  const asyncServerStop = promisify(server.stop).bind(server)

  async function cleanup (signal) {
    if (!state.isShuttingDown) {
      state.isShuttingDown = true
      try {
        await beforeShutdown()
        await asyncServerStop()
        await onSignal()
        await onShutdown()
        signals.forEach(sig => process.removeListener(sig, cleanup))
        process.kill(process.pid, signal)
      } catch (error) {
        logger('error happened during shutdown', error)
        process.exit(1)
      }
    }
  }
  signals.forEach(
    sig => process.on(sig, cleanup)
  )
}

function terminus (server, options = {}) {
  const { signal = 'SIGTERM',
    signals = [],
    timeout = 1000,
    healthChecks = {},
    onSendFailureDuringShutdown,
    onShutdown = noopResolves,
    beforeShutdown = noopResolves,
    logger = noop } = options
  const onSignal = options.onSignal || options.onSigterm || noopResolves
  const state = Object.assign({}, intialState)

  if (Object.keys(healthChecks).length > 0) {
    decorateWithHealthCheck(server, state, {
      healthChecks,
      logger,
      onSendFailureDuringShutdown
    })
  }

  // push the signal into the array
  // for backwards compatability
  if (!signals.includes(signal)) signals.push(signal)
  decorateWithSignalHandler(server, state, {
    signals,
    onSignal,
    beforeShutdown,
    onShutdown,
    timeout,
    logger
  })

  return server
}

module.exports.createTerminus = terminus
