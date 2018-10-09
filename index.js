'use strict'

const { createTerminus, getStatus } = require('./lib/terminus')
const { HealthCheckError } = require('./lib/terminus-error')

module.exports = {
  createTerminus,
  getStatus,
  HealthCheckError
}
