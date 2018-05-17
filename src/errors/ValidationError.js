const AppError = require('./AppError')

class ValidationError extends AppError {
  constructor (options = {}) {
    super({
      message: options.message || 'Validation error',
      type: 'validation',
      severity: 'warning',
      statusCode: 400,
      err: options.err,
      data: options.data
    })
  }
}

module.exports = ValidationError
