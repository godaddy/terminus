module.exports.TerminusError = class TerminusError extends Error {
  constructor (message, causes) {
    super(message)

    this.causes = causes

    Error.captureStackTrace(this, this.constructor)
  }
}
