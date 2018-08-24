const uuid = require('uuid/v4')
const ow = require('ow')
const errors = require('./errors')

const methodNamePattern = /^[a-zA-Z_][a-zA-Z_0-9]*(\/[a-zA-Z_][a-zA-Z_0-9]*)*$/i

class Store {
  constructor (options = {}) {
    this.methods = new Map()
    this.middleware = []
    if (options.getDefaultContext !== undefined) {
      ow(options.getDefaultContext, ow.function.label('options.getDefaultContext'))
    }
    this.getDefaultContext = options.getDefaultContext || (() => null)
  }

  define (name, fn, meta) {
    ow(name, ow.string.label('name').is(name => name.match(methodNamePattern) ? true : 'Invalid method name')) // TODO better message
    ow(fn, ow.function.label('fn'))
    ow(name, ow.string.label('name').is(name => this.methods.has(name) ? `Method '${name}' is already defined` : true))
    this.methods.set(name, { fn, meta })
    return this
  }

  use (fn) {
    ow(fn, ow.function.label('fn'))
    this.middleware.push(fn)
    return this
  }

  plugin (pluginFn, options) {
    ow(pluginFn, ow.function.label('pluginFn'))
    return pluginFn(this, options)
  }

  async dispatch (name, payload, context, options = {}) {
    if (context === undefined) {
      context = this.getDefaultContext()
    }
    return this._dispatch(name, payload, context, {
      cid: options.cid || uuid(),
      seq: 0
    }, [])
  }

  _dispatch (name, payload, context, options, stack) {
    const methodEntry = this.methods.get(name)
    if (!methodEntry) {
      throw new errors.NotImplementedError({ message: `Method '${name}' is not defined` })
    }
    const cid = options.cid
    const seq = options.seq
    const { fn, meta } = methodEntry

    ++options.seq

    stack = stack.concat([{
      cid,
      seq,
      method: name
    }])

    const methodContext = {
      dispatch: (name, payload) => {
        return this._dispatch(name, payload, context, options, stack)
      },
      context,
      cid,
      seq,
      meta,
      errors,
      stack
    }

    const middlewareContext = {
      method: name,
      context,
      cid,
      seq,
      meta,
      errors,
      stack,
      methodContext
    }

    const middlewares = this.middleware.map(middleware => middleware.bind(null))
    const next = getNext(middlewares, fn, { middlewareContext, methodContext })
    return next(payload)
  }
}

function getNext (middlewares, fn, { middlewareContext }) {
  let nextCalled = false
  if (middlewares.length) {
    const middleware = middlewares.shift()
    return async (payload) => {
      if (nextCalled) {
        throw new Error('next() called more than once')
      }
      nextCalled = true
      const next = getNext(middlewares, fn, { middlewareContext })
      return middleware(payload, middlewareContext, next)
    }
  } else {
    return async (payload) => {
      if (nextCalled) {
        throw new Error('next() called more than once')
      }
      nextCalled = true
      return fn(payload, middlewareContext.methodContext)
    }
  }
}

module.exports = Store
