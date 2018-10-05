'use strict'

const { Terminus } = require('./lib/terminus')
const { TerminusError, HealthCheckError, HealthCheckNotFoundError } = require('./lib/terminus-error')

module.exports = {
  Terminus,
  HealthCheckError,
  TerminusError,
  HealthCheckNotFoundError
}
