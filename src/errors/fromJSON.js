const AuthenticationError = require('./AuthenticationError')
const AuthorizationError = require('./AuthorizationError')
const InternalError = require('./InternalError')
const NotFoundError = require('./NotFoundError')
const NotImplementedError = require('./NotImplementedError')
const ValidationError = require('./ValidationError')

const errorMap = {
  authentication: AuthenticationError,
  authorization: AuthorizationError,
  validation: ValidationError,
  notFound: NotFoundError,
  notImplemented: NotImplementedError,
  internal: InternalError
}

module.exports = function fromJSON (json) {
  json || (json = {})
  const ErrCls = errorMap[json.type]

  if (!ErrCls) {
    throw new Error(`error type '${json.type}' not found - could not build error from JSON`)
  }

  const err = new ErrCls({
    message: json.message,
    severity: json.severity
  })

  if (json.reasons) {
    err.addReason(json.reasons)
  }

  return err
}
