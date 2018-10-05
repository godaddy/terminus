const { TerminusError } = require('./terminus-error')

module.exports.HealthCheckNotFoundError = class HealthCheckNotFoundError extends TerminusError {}
