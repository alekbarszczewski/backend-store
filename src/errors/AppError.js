const ExtendableError = require('es6-error')

class AppError extends ExtendableError {
  constructor (options = {}) {
    super(options.message || 'App error')
    this.err = options.err || null
    this.type = options.type || 'internal'
    this.severity = options.severity || 'error'
    this.statusCode = options.statusCode || 500
    this.data = options.data || null
    this.reasons = null
  }

  getOriginalError () {
    return this.err
  }

  getType () {
    return this.type
  }

  getSeverity () {
    return this.severity
  }

  getStatusCode () {
    return this.statusCode
  }

  getData () {
    return this.data
  }

  getReasons () {
    return this.reasons
  }

  addReason (reasons) {
    if (!Array.isArray(reasons)) {
      reasons = [reasons]
    }
    this.reasons || (this.reasons = [])
    reasons.forEach(reason => {
      this.reasons.push(reason)
    })
    return this
  }

  hasReasons () {
    return !!(this.reasons && this.reasons.length)
  }

  toJSON () {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      reasons: this.reasons
    }
  }
}

module.exports = AppError
