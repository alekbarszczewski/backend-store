const AppError = require('./AppError')

class InternalError extends AppError {
  constructor (message, options = {}) {
    options = AppError.normalizeOptions(message, options)
    super({
      message: options.message || 'Internal error',
      type: 'internal',
      severity: 'error',
      statusCode: 500,
      err: options.err,
      data: options.data
    })
  }
}

module.exports = InternalError
