const AppError = require('./AppError')

class NotImplementedError extends AppError {
  constructor (message, options = {}) {
    options = AppError.normalizeOptions(message, options)
    super({
      message: options.message || 'Not implemented error',
      type: 'notImplemented',
      severity: 'error',
      statusCode: 503,
      err: options.err,
      data: options.data
    })
  }
}

module.exports = NotImplementedError
