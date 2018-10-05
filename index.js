'use strict'

const { createTerminus } = require('./lib/terminus')
const { HealthCheckError } = require('./lib/errors/health-check-error')
const { TerminusError } = require('./lib/errors/terminus-error')
const { HealthCheckNotFoundError } = require('./lib/errors/health-check-not-found-error')

module.exports = {
  createTerminus,
  HealthCheckError,
  TerminusError,
  HealthCheckNotFoundError
}
