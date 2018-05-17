const AppError = require('./AppError')
const InternalError = require('./InternalError')

const wrapError = (err) => {
  if (!(err instanceof AppError)) {
    err = new InternalError({ err })
  }
  return err
}

module.exports = wrapError
