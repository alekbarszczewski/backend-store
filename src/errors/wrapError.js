const AppError = require('./AppError')
const InternalError = require('./InternalError')

module.exports = function wrapError (err) {
  if (!err) {
    return err
  } else if (!(err instanceof AppError)) {
    return new InternalError({ err })
  } else {
    return err
  }
}
