module.exports.HealthCheckError = class TerminusError extends Error {
  constructor (message, causes) {
    super(message)

    this.causes = causes

    Error.captureStackTrace(this, this.constructor)
  }
}
