const ow = require('ow')
const bunyan = require('bunyan')
const errors = require('./../errors')

function logger (store, options = {}) {
  const log = bunyan.createLogger({
    serializers: {
      ...bunyan.stdSerializers,
      originalErr: bunyan.stdSerializers.err
    },
    ...options.bunyan,
    name: options.name || 'app'
  })
  store.use(logMiddleware.bind(null, {
    log,
    customData: options.customData,
    customLogLevel: options.customLogLevel
  }))
}

async function logMiddleware ({ log, customData, customLogLevel }, ctx, next) {
  const { cid, seq, method, stack, context } = ctx

  const methodLog = log.child({
    cid,
    seq,
    method,
    stack
  })

  const userLog = methodLog.child({
    source: 'user',
    when: 'inside'
  })

  ctx.log = userLog

  const startTime = new Date()
  try {
    logMethod(methodLog, {
      customDataFn: customData,
      customLogLevel,
      when: 'before',
      ctx
    })
    const result = await next()
    logMethod(methodLog, {
      customDataFn: customData,
      customLogLevel,
      when: 'after',
      ctx,
      startTime
    })
    return result
  } catch (err) {
    logMethod(methodLog, {
      customDataFn: customData,
      customLogLevel,
      when: 'after',
      ctx,
      err,
      startTime
    })
    throw err
  }
}

function logMethod (log, { customDataFn, customLogLevel, when, ctx, startTime, err }) {
  const elapsedMs = startTime ? new Date().getTime() - startTime.getTime() : undefined
  const logContext = { when, startTime, err, middlewareContext: ctx }
  const customData = customDataFn ? customDataFn(logContext) : null
  const logData = {
    ...customData,
    source: 'auto',
    when,
    err,
    ms: elapsedMs
  }
  let logLevel = customLogLevel ? customLogLevel(logContext) : null
  if (!logLevel) {
    logLevel = 'info'
    if (err) {
      if (err instanceof errors.AppError) {
        logData.originalErr = err.getOriginalError() || null
        logData.errInfo = {
          ...err.toJSON(),
          data: err.getData()
        }
        logLevel = err.getSeverity() === 'warning' ? 'warn' : 'error' // TODO custom severity
      } else {
        logLevel = 'error'
      }
    }
  }
  const message = `${when}_${ctx.method}` + (elapsedMs != null ? ` (${elapsedMs}ms)` : '')
  log[logLevel](logData, message)
}

module.exports = logger
module.exports.logMiddleware = logMiddleware
module.exports.logMethod = logMethod
