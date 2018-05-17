const AppError = require('./AppError')

class NotFoundError extends AppError {
  constructor (options = {}) {
    super({
      message: options.message || 'Not found error',
      type: 'notFound',
      severity: 'warning',
      statusCode: 404,
      err: options.err,
      data: options.data
    })
  }
}

module.exports = NotFoundError
