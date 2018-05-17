const AppError = require('./AppError')

class NotImplementedError extends AppError {
  constructor (options = {}) {
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
