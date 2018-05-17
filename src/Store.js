const uuid = require('uuid/v4')
const ow = require('ow')
const errors = require('./errors')

const methodNamePattern = /^[a-zA-Z_][a-zA-Z_0-9]*(\/[a-zA-Z_][a-zA-Z_0-9]*)*$/i

class Store {

  constructor () {
    this.methods = new Map()
    this.middleware = []
  }

  define (name, fn, meta) {
    ow(name, ow.string.is(name => name.match(methodNamePattern) ? true : 'Invalid method name')) // TODO better message
    ow(fn, ow.function)
    ow(name, ow.string.is(name => this.methods.has(name) ? `Method '${name}' is already defined` : true))
    this.methods.set(name, { fn, meta })
    return this
  }

  use (fn) {
    ow(fn, ow.function)
    this.middleware.push(fn)
    return this
  }

  plugin (pluginFn, options) {
    ow(pluginFn, ow.function)
    return pluginFn(this, options)
  }

  async dispatch (name, payload, context, options = {}) {
    return this._dispatch(name, payload, context, {
      cid: options.cid || uuid(),
      seq: 0
    }, [])
  }

  _dispatch (name, payload, context, options, stack) {
    const methodEntry = this.methods.get(name)
    if (!methodEntry) {
      throw new Error(`Method '${name}' is not defined`)
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
      payload,
      context,
      cid,
      seq,
      meta,
      errors,
      stack
    }

    const middlewares = this.middleware.map(middleware => {
      return middleware.bind(null, middlewareContext)
    })
    const next = getNext(middlewares, fn, { middlewareContext, methodContext })
    return next()
  }
}

function getNext (middlewares, fn, { middlewareContext, methodContext }) {
  let nextCalled = false
  if (middlewares.length) {
    const middleware = middlewares.shift()
    return async () => {
      if (nextCalled) {
        throw new Error('next() called more than once')
      }
      nextCalled = true
      const next = getNext(middlewares, fn, { middlewareContext, methodContext })
      return middleware(next)
    }
  } else {
    return async () => {
      if (nextCalled) {
        throw new Error('next() called more than once')
      }
      nextCalled = true
      return fn(middlewareContext.payload, methodContext)
    }
  }
}

module.exports.Store = Store
module.exports.getNext = getNext
