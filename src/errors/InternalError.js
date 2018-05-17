const AppError = require('./AppError')

class InternalError extends AppError {
  constructor (options = {}) {
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
