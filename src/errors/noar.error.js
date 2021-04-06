const errors = {}

class NoarError extends Error {
  constructor (message) {
    super(message)

    Error.captureStackTrace(this, this.constructor)
  }
}

errors.NotFoundError = class extends NoarError {
  constructor (message, model, condition) {
    super(message)

    this.model = model
    this.condition = condition
  }
}

errors.ValidationError = class extends NoarError {
  constructor (message, errors) {
    super(message)

    this.errors = errors
  }
}

module.exports = { ...errors }
