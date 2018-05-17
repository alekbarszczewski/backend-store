const ExtendableError = require('es6-error')
const ow = require('ow')

class AppError extends ExtendableError {
  constructor (options = {}) {
    ow(options.message, ow.any(ow.string, ow.null, ow.undefined))
    ow(options.err, ow.any(ow.error, ow.null, ow.undefined))
    ow(options.type, ow.any(ow.string, ow.null, ow.undefined))
    ow(options.severity, ow.any(ow.string, ow.null, ow.undefined))
    ow(options.statusCode, ow.any(ow.number, ow.null, ow.undefined))
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
    ow(reasons, ow.any(
      ow.object.hasKeys('path', 'message').valuesOfType(ow.string),
      ow.array.ofType(ow.object.hasKeys('path', 'message').valuesOfType(ow.string))
    ))
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
