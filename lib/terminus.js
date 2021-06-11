'use strict'

const stoppable = require('stoppable')
const { promisify } = require('util')

let SUCCESS_RESPONSE

let FAILURE_RESPONSE

function noopResolves () {
  return Promise.resolve()
}

async function sendSuccess (res, { info, verbatim, statusOk, statusOkResponse }) {
  res.statusCode = statusOk
  res.setHeader('Content-Type', 'application/json')
  if (info) {
    return res.end(
      JSON.stringify(
        Object.assign(
          statusOkResponse,
          verbatim ? info : { info, details: info }
        )
      )
    )
  }
  res.end(SUCCESS_RESPONSE)
}

async function sendFailure (res, options) {
  const { error, onSendFailureDuringShutdown, exposeStackTraces, statusCode, statusResponse, statusError, statusErrorResponse } = options

  function replaceErrors (_, value) {
    if (value instanceof Error) {
      const error = {}

      Object.getOwnPropertyNames(value).forEach(function (key) {
        if (exposeStackTraces !== true && key === 'stack') return
        error[key] = value[key]
      })

      return error
    }

    return value
  }

  if (onSendFailureDuringShutdown) {
    await onSendFailureDuringShutdown()
  }
  res.statusCode = statusCode || statusError
  const responseBody = statusResponse || statusErrorResponse
  res.setHeader('Content-Type', 'application/json')
  if (error) {
    return res.end(JSON.stringify(
      Object.assign(
        responseBody, {
        error: error,
        details: error
      }), replaceErrors))
  }
  res.end(statusResponse ? JSON.stringify(responseBody) : FAILURE_RESPONSE)
}

const intialState = {
  isShuttingDown: false
}

function noop () {}

function decorateWithHealthCheck (server, state, options) {
  const { healthChecks, logger, onSendFailureDuringShutdown, sendFailuresDuringShutdown, caseInsensitive, statusOk, statusOkResponse, statusError, statusErrorResponse } = options

  let hasSetHandler = false
  const createHandler = (listener) => {
    const check = hasSetHandler
      ? () => {}
      : async (healthCheck, res) => {
        if (state.isShuttingDown && sendFailuresDuringShutdown) {
          return sendFailure(res, { onSendFailureDuringShutdown, statusError, statusErrorResponse })
        }
        let info
        try {
          info = await healthCheck({ state })
        } catch (error) {
          logger('healthcheck failed', error)
          const statusCode = error.statusCode
          const statusResponse = error.statusResponse
          return sendFailure(res, { error: error.causes, exposeStackTraces: healthChecks.__unsafeExposeStackTraces, statusCode, statusResponse, statusError, statusErrorResponse })
        }
        return sendSuccess(res, { info, verbatim: healthChecks.verbatim, statusOk, statusOkResponse })
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
    sendFailuresDuringShutdown = true,
    onSendFailureDuringShutdown,
    onShutdown = noopResolves,
    beforeShutdown = noopResolves,
    logger = noop,
    caseInsensitive = false,
    statusOk = 200,
    statusOkResponse = { status: 'ok' },
    statusError = 503,
    statusErrorResponse = { status: 'error' }
  } = options
  const onSignal = options.onSignal || options.onSigterm || noopResolves
  const state = Object.assign({}, intialState)

  SUCCESS_RESPONSE = JSON.stringify(statusOkResponse)

  FAILURE_RESPONSE = JSON.stringify(statusErrorResponse)

  if (Object.keys(healthChecks).length > 0) {
    decorateWithHealthCheck(server, state, {
      healthChecks,
      logger,
      sendFailuresDuringShutdown,
      onSendFailureDuringShutdown,
      caseInsensitive,
      statusOk,
      statusOkResponse,
      statusError,
      statusErrorResponse
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
