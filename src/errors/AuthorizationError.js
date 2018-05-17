const AppError = require('./AppError')

class AuthorizationError extends AppError {
  constructor (options = {}) {
    super({
      message: options.message || 'Authorization error',
      type: 'authorization',
      severity: 'warning',
      statusCode: 403,
      err: options.err,
      data: options.data
    })
  }
}

module.exports = AuthorizationError
