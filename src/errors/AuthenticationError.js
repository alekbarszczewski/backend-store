const AppError = require('./AppError')

class AuthenticationError extends AppError {
  constructor (message, options = {}) {
    options = AppError.normalizeOptions(message, options)
    super({
      message: options.message || 'Authentication error',
      type: 'authentication',
      severity: 'warning',
      statusCode: 401,
      err: options.err,
      data: options.data
    })
  }
}

module.exports = AuthenticationError
