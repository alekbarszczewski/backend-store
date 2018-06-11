const ow = require('ow')
const bunyan = require('bunyan')
const errors = require('./../errors')

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

function logger (store, options = {}) {
  ow(options.name, ow.any(ow.string, ow.null, ow.undefined))
  ow(options.bunyan, ow.any(ow.object, ow.null, ow.undefined))
  ow(options.customData, ow.any(ow.function, ow.null, ow.undefined))
  ow(options.customLogLevel, ow.any(ow.function, ow.null, ow.undefined))

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

async function logMiddleware ({ log, customData, customLogLevel }, payload, ctx, next) {
  const { cid, seq, method, stack } = ctx

  const methodLog = log.child({
    cid,
    seq,
    method,
    stack
  })

  const startTime = new Date()

  ctx.log = createUserLog(methodLog, {
    customDataFn: customData,
    ctx,
    payload,
    startTime,
    when: 'middleware'
  })
  ctx.methodContext.log = createUserLog(methodLog, {
    customDataFn: customData,
    ctx,
    payload,
    startTime,
    when: 'inside'
  })

  try {
    logMethod(methodLog, {
      customDataFn: customData,
      customLogLevel,
      when: 'before',
      ctx,
      payload
    })
    const result = await next(payload)
    logMethod(methodLog, {
      customDataFn: customData,
      customLogLevel,
      when: 'after',
      ctx,
      payload,
      startTime
    })
    return result
  } catch (err) {
    logMethod(methodLog, {
      customDataFn: customData,
      customLogLevel,
      when: 'after',
      ctx,
      payload,
      err,
      startTime
    })
    throw err
  }
}

function createUserLog (log, { customDataFn, ctx, payload, startTime, when }) {
  const userLog = {}
  logLevels.forEach(level => {
    userLog[level] = (data = {}, message) => {
      if (typeof data === 'string') {
        message = data
        data = {}
      }
      logMethod(log, {
        customDataFn (logContext) {
          const customData = customDataFn ? customDataFn(logContext) : {}
          return {
            ...data,
            ...customData
          }
        },
        customLogLevel () {
          return level
        },
        when,
        source: 'user',
        ctx,
        payload,
        startTime,
        err: data.err,
        message
      })
    }
  })
  return userLog
}

function logMethod (log, { customDataFn, customLogLevel, when, source = 'auto', ctx, payload, startTime, err, message }) {
  const elapsedMs = startTime ? new Date().getTime() - startTime.getTime() : undefined
  const logContext = {
    when,
    startTime,
    err,
    source,
    method: ctx.method,
    context: ctx.context,
    cid: ctx.cid,
    seq: ctx.seq,
    meta: ctx.meta,
    stack: ctx.stack,
    payload
  }
  const customData = customDataFn ? customDataFn(logContext) : null
  const logData = {
    ...customData,
    source,
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
  message = message || `${when}_${ctx.method}` + (elapsedMs != null ? ` (${elapsedMs}ms)` : '')
  log[logLevel](logData, message)
}

module.exports = logger
module.exports.logMiddleware = logMiddleware
module.exports.logMethod = logMethod
