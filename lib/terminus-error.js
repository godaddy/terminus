class TerminusError extends Error { }

class HealthCheckNotFoundError extends TerminusError { }

class HealthCheckError extends TerminusError {
  constructor(message, causes) {
    super(message)

    this.causes = causes

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = {
    HealthCheckError,
    TerminusError,
    HealthCheckNotFoundError
};
