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
  /**
   * Initailizes the HealthCheckError
   * @param {string} message The error message
   * @param {string[]} causes Array of error messages which were thrown during the heath check
   */
  constructor (message, causes) {
    super(message)

    this.causes = causes

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = {
  HealthCheckError,
  TerminusError,
  HealthCheckNotFoundError
}
