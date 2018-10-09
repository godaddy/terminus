/**
 * A TerminusError represents a error which
 * gets expictely thrown by the Terminus library
 */
class TerminusError extends Error { }

/**
 * Gets thrown when the user requests a health check,
 * which is not registered
 */
class HealthCheckNotFoundError extends TerminusError { }

/**
 * Gets thrown when a health check failed
 */
class HealthCheckError extends TerminusError {
  constructor (message, causes) {
    super(message)

    this.causes = causes

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = {
  TerminusError,
  HealthCheckError,
  HealthCheckNotFoundError
}
