const { TerminusError } = require('./terminus-error')

module.exports.HealthCheckError = class HealthCheckError extends TerminusError {
  constructor (message, causes) {
    super(message)

    this.causes = causes

    Error.captureStackTrace(this, this.constructor)
  }
}
