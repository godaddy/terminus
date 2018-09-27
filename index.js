'use strict'

const { createTerminus } = require('./lib/terminus')
const { HealthCheckError } = require('./lib/terminus-error')

module.exports = {
  createTerminus,
  HealthCheckError
}
