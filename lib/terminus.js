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
  const { info, verbatim } = options

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  if (info) {
    return res.end(
      JSON.stringify(
        Object.assign(
          {
            status: 'ok'
          },
          verbatim ? info : { info, details: info }
        )
      )
    )
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
      error: error,
      details: error
    }))
  }
  res.end(FAILURE_RESPONSE)
}

const intialState = {
  isShuttingDown: false
}

function noop () {}

function decorateWithHealthCheck (server, state, options) {
  const { healthChecks, logger, onSendFailureDuringShutdown, caseInsensitive } = options

  let hasSetHandler = false
  const createHandler = (listener) => {
    const check = hasSetHandler ? () => {} : async (healthCheck, res) => {
      if (state.isShuttingDown) {
        return sendFailure(res, { onSendFailureDuringShutdown })
      }
      let info
      try {
        info = await healthCheck()
      } catch (error) {
        logger('healthcheck failed', error)
        return sendFailure(res, { error: error.causes })
      }
      return sendSuccess(res, { info, verbatim: healthChecks.verbatim })
    }

    hasSetHandler = true

    return async (req, res) => {
      const url = caseInsensitive ? req.url.toLowerCase() : req.url
      const healthCheck = healthChecks[url]
      if (healthCheck) {
        return check(healthCheck, res)
      } else {
        listener(req, res)
      }
    }
  }

  server.listeners('request').forEach((listener) => {
    server.removeListener('request', listener)
    server.on('request', createHandler(listener))
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
  // Supporting case insensitive routes by lowering case all routes.
  if (options.caseInsensitive && options.healthChecks) {
    const healthChecks = {}

    for (const key in options.healthChecks) {
      healthChecks[key.toLowerCase()] = options.healthChecks[key]
    }

    options.healthChecks = healthChecks
  }

  const {
    signal = 'SIGTERM',
    signals = [],
    timeout = 1000,
    healthChecks = {},
    onSendFailureDuringShutdown,
    onShutdown = noopResolves,
    beforeShutdown = noopResolves,
    logger = noop,
    caseInsensitive = false
  } = options
  const onSignal = options.onSignal || options.onSigterm || noopResolves
  const state = Object.assign({}, intialState)

  if (Object.keys(healthChecks).length > 0) {
    decorateWithHealthCheck(server, state, {
      healthChecks,
      logger,
      onSendFailureDuringShutdown,
      caseInsensitive
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
