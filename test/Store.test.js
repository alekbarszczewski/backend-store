/* eslint-env mocha */

const chai = require('chai')
const sinon = require('sinon')
const Store = require('./../src/Store').Store
const errors = require('./../src/errors')

chai.use(require('chai-uuid'))
chai.use(require('chai-as-promised'))
const expect = chai.expect

describe('Store', () => {
  describe('#constructor', () => {
    it('create Store class instances with empty method map and empty middleware array', () => {
      const s = new Store()
      expect(s).to.be.instanceof(Store)
      expect(s.methods).to.be.instanceof(Map)
      expect(s.methods.size).to.equal(0)
      expect(s.middleware).to.be.instanceof(Array)
      expect(s.middleware.length).to.equal(0)
    })
  })

  describe('#define', () => {
    it('define method and return store instance', () => {
      const s = new Store()
      const name = 'test'
      const fn = function () {}
      const meta = { test: 123 }
      const result = s.define(name, fn, meta)
      expect(result).to.equal(s)
      expect(s.methods.size).to.equal(1)
      expect(s.methods.get(name).fn).to.equal(fn)
      expect(s.methods.get(name).meta).to.equal(meta)
    })

    it('define method without meta', () => {
      const s = new Store()
      s.define('test', function () {})
      expect(s.methods.get('test').meta).to.equal(undefined)
    })

    it('define method with valid name', () => {
      [
        'a',
        'a1',
        'a/b',
        'a1/b1',
        'a/b/c/d/e/f',
        '_a',
        '_a/_b',
        '_/_'
      ].forEach(validName => {
        const s = new Store()
        expect(() => {
          s.define(validName, function () {})
        }).to.not.throw()
      })
    })

    it('define method with meta', () => {
      [
        null,
        undefined,
        123,
        true,
        {},
        [],
        'abc'
      ].forEach(meta => {
        const s = new Store()
        s.define('test', function () {}, meta)
        expect(s.methods.get('test').meta).to.equal(meta)
      })
    })

    it('throw error on invalid name arg', () => {
      [
        '',
        '/',
        'abc$',
        '1abc',
        'abc/',
        'abc//def',
        'abc/1abc',
        '/abc',
        'abc/abc/'
      ].forEach(invalidName => {
        const s = new Store()
        expect(() => {
          s.define(invalidName, function () {})
        }).to.throw('Invalid method name')
      })
    })

    it('throw error on invalid or missing name arg', () => {
      [
        null,
        undefined,
        123,
        true,
        {},
        []
      ].forEach(invalidName => {
        const s = new Store()
        expect(() => {
          s.define(invalidName, function () {})
        }).to.throw(/^Expected argument to be of type `string` but received type/)
      })
    })

    it('throw error on invalid or missing fn arg', () => {
      [
        null,
        undefined,
        123,
        true,
        {},
        [],
        'abc'
      ].forEach(invalidFn => {
        const s = new Store()
        expect(() => {
          s.define('test', invalidFn)
        }).to.throw(/^Expected argument to be of type `function` but received type/)
      })
    })

    it('throw error on duplicate method name', () => {
      const s = new Store()
      s.define('test', function () {})
      expect(() => {
        s.define('test', function () {})
      }).to.throw(`Method 'test' is already defined`)
    })
  })

  describe('#use', () => {
    it('add middleware and return store instance', () => {
      const s = new Store()
      const fn = function () {}
      const result = s.use(fn)
      expect(result).to.equal(s)
      expect(s.middleware.length).to.equal(1)
      expect(s.middleware[0]).to.equal(fn)
    })

    it('throw error on invalid or missing fn arg', () => {
      [
        null,
        undefined,
        123,
        true,
        {},
        [],
        'abc'
      ].forEach(fn => {
        const s = new Store()
        expect(() => {
          s.use(fn)
        }).to.throw(/Expected argument to be of type `function` but received type/)
      })
    })
  })

  describe('#plugin', () => {
    it('execute plugin fn with store instance and options and return plugin fn result', () => {
      const s = new Store()
      const fnResult = {}
      const fn = sinon.fake.returns(fnResult)
      const options = {}
      const result = s.plugin(fn, options)
      expect(result).to.equal(fnResult)
      expect(fn.calledOnce).to.equal(true)
      expect(fn.firstCall.args[0]).to.equal(s)
      expect(fn.firstCall.args[1]).to.equal(options)
    })

    it('execute plugin fn without options', () => {
      const s = new Store()
      const fnResult = {}
      const fn = sinon.fake.returns(fnResult)
      const result = s.plugin(fn)
      expect(result).to.equal(fnResult)
      expect(fn.calledOnce).to.equal(true)
      expect(fn.firstCall.args[0]).to.equal(s)
      expect(fn.firstCall.args[1]).to.equal(undefined)
    })

    it('throw error on invalid or missing fn arg', () => {
      const s = new Store()
      const invalidPluginFns = [
        null,
        undefined,
        123,
        true,
        {},
        [],
        'abc'
      ]
      invalidPluginFns.forEach(pluginFn => {
        expect(() => {
          s.plugin(pluginFn)
        }).to.throw(/Expected argument to be of type `function`/)
      })
    })
  })

  describe('#dispatch', () => {
    it('dispatch method', async () => {
      const s = new Store()
      const fnResult = {}
      const fn = sinon.fake.resolves(fnResult)
      const meta = {}
      s.define('test', fn, meta)
      const payload = {}
      const context = {}
      const result = await s.dispatch('test', payload, context)
      expect(result).to.equal(fnResult)
      const methodContext = fn.firstCall.args[1]
      const methodPayload = fn.firstCall.args[0]
      expect(fn.calledOnce).to.equal(true)
      expect(methodContext.context).to.equal(context)
      expect(methodContext.meta).to.equal(meta)
      expect(methodContext.errors).to.equal(errors)
      expect(methodContext.dispatch).to.be.instanceof(Function)
      expect(methodContext.seq).to.equal(0)
      expect(methodContext.cid).to.be.a.uuid('v4')
      expect(methodContext.stack).to.eql([{
        cid: methodContext.cid,
        seq: methodContext.seq,
        method: 'test'
      }])
      expect(methodPayload).to.equal(payload)
    })

    it('dispatch method without payload and context', async () => {
      const s = new Store()
      const fnResult = {}
      const fn = sinon.fake.resolves(fnResult)
      s.define('test', fn)
      const result = await s.dispatch('test')
      expect(result).to.equal(fnResult)
      const methodContext = fn.firstCall.args[1]
      const methodPayload = fn.firstCall.args[0]
      expect(methodContext.context).to.equal(undefined)
      expect(methodPayload).to.equal(undefined)
    })

    it('dispatch method from inside of method and allow to modify context', async () => {
      const s = new Store()
      const fn1 = sinon.fake(async (payload, { dispatch, context }) => {
        context.counter++
        const result2 = await dispatch('fn2', 'payload2')
        return ['fn1'].concat(result2)
      })
      const fn2 = sinon.fake(async (payload, { dispatch, context }) => {
        context.counter++
        const result3 = await dispatch('fn3', 'payload3')
        return ['fn2'].concat(result3)
      })
      const fn3 = sinon.fake.resolves('fn3')

      s.define('fn1', fn1, 'meta1')
      s.define('fn2', fn2, 'meta2')
      s.define('fn3', fn3, 'meta3')

      const context = { counter: 0 }
      const result = await s.dispatch('fn1', 'payload1', context)
      expect(result).to.eql(['fn1', 'fn2', 'fn3'])

      const cid = fn1.firstCall.args[1].cid
      const stack = [{
        cid,
        seq: 0,
        method: 'fn1'
      }]

      const fakes = [fn1, fn2, fn3]
      fakes.forEach((fn, index) => {
        const methodContext = fn.firstCall.args[1]
        const methodPayload = fn.firstCall.args[0]
        expect(methodPayload).to.equal(`payload${index + 1}`)
        expect(methodContext.context).to.equal(context)
        expect(methodContext.context.counter).to.equal(2)
        expect(methodContext.meta).to.equal(`meta${index + 1}`)
        expect(methodContext.errors).to.equal(errors)
        expect(methodContext.dispatch).to.be.instanceof(Function)
        expect(methodContext.seq).to.equal(index)
        expect(methodContext.cid).to.be.equal(cid).and.to.be.a.uuid('v4')
        expect(methodContext.stack).to.eql(stack)
        stack.push({
          cid,
          seq: index + 1,
          method: `fn${index + 2}`
        })
      })
    })

    it('respect custom cid option', async () => {
      const s = new Store()
      const fn1 = sinon.fake(async (payload, { dispatch }) => {
        await dispatch('fn2')
      })
      const fn2 = sinon.fake.resolves()

      s.define('fn1', fn1)
      s.define('fn2', fn2)

      const payload = {}
      const context = {}
      await s.dispatch('fn1', payload, context, { cid: 'abc' })

      const cid1 = fn1.firstCall.args[1].cid
      const cid2 = fn2.firstCall.args[1].cid

      expect(cid1).to.equal('abc').and.to.equal(cid2)
    })

    it('throw error if method does not exist', async () => {
      const s = new Store()
      let error
      try {
        await s.dispatch('abc')
      } catch (err) {
        error = err
      }
      await expect(error).to.be.instanceOf(errors.NotImplementedError)
      expect(error.message).to.equal(`Method 'abc' is not defined`)
    })

    it('run middleware', async () => {
      const s = new Store()
      const fn1 = sinon.fake(async (payload, { dispatch }) => {
        return dispatch('fn2', 'payload2')
      })
      const fn2 = sinon.fake.resolves('fn2')
      const meta1 = {}
      const meta2 = {}
      s.define('fn1', fn1, meta1)
      s.define('fn2', fn2, meta2)
      const m1 = sinon.fake((ctx, next) => {
        return next()
      })
      s.use(m1)
      const context = {}
      await s.dispatch('fn1', 'payload1', context)
      expect(m1.calledTwice).to.equal(true)
      expect(fn1.calledOnce).to.equal(true)
      expect(fn2.calledOnce).to.equal(true)

      const [ctx1, next1] = m1.firstCall.args
      const [ctx2, next2] = m1.secondCall.args
      const cid = fn1.firstCall.args[1].cid
      const stack = [{
        cid,
        seq: 0,
        method: 'fn1'
      }]

      expect(ctx1.method).to.equal('fn1')
      expect(ctx1.payload).to.equal('payload1')
      expect(ctx1.context).to.equal(context)
      expect(ctx1.cid).to.equal(cid).and.be.a.uuid('v4')
      expect(ctx1.seq).to.equal(0)
      expect(ctx1.meta).to.equal(meta1)
      expect(ctx1.errors).to.equal(errors)
      expect(ctx1.stack).to.eql(stack)
      expect(next1).to.be.instanceOf(Function)

      stack.push({ cid, seq: 1, method: 'fn2' })

      expect(ctx2.method).to.equal('fn2')
      expect(ctx2.payload).to.equal('payload2')
      expect(ctx2.context).to.equal(context)
      expect(ctx2.cid).to.equal(cid).and.be.a.uuid('v4')
      expect(ctx2.seq).to.equal(1)
      expect(ctx2.meta).to.equal(meta2)
      expect(ctx2.errors).to.equal(errors)
      expect(ctx2.stack).to.eql(stack)
      expect(next2).to.be.instanceOf(Function)
    })

    it('modify payload in middleware #1', async () => {
      const s = new Store()
      const fn1 = sinon.fake()
      s.define('fn1', fn1)
      const m1 = sinon.fake((ctx, next) => {
        ctx.payload = 'modified1'
        return next()
      })
      const m2 = sinon.fake((ctx, next) => {
        ctx.payload = 'modified2'
        return next()
      })
      s.use(m1)
      s.use(m2)
      await s.dispatch('fn1', 'original')
      expect(fn1.calledOnce).to.equal(true)
      expect(fn1.firstCall.args[0]).to.equal('modified2')
    })

    it('modify payload in middleware #2', async () => {
      const s = new Store()
      const fn1 = sinon.fake()
      s.define('fn1', fn1)
      const m1 = sinon.fake((ctx, next) => {
        ctx.payload.counter++
        return next()
      })
      s.use(m1)
      await s.dispatch('fn1', { counter: 0 })
      expect(fn1.calledOnce).to.equal(true)
      expect(fn1.firstCall.args[0]).to.eql({ counter: 1 })
    })

    it('modify context in middleware', async () => {
      const s = new Store()
      const fn1 = sinon.fake()
      s.define('fn1', fn1)
      const m1 = sinon.fake((ctx, next) => {
        ctx.context.counter++
        return next()
      })
      s.use(m1)
      await s.dispatch('fn1', null, { counter: 0 })
      expect(fn1.calledOnce).to.equal(true)
      expect(fn1.firstCall.args[1].context).to.eql({ counter: 1 })
    })

    it('modify result in middleware', async () => {
      const s = new Store()
      const fn1 = sinon.fake.resolves(['fn1'])
      s.define('fn1', fn1)
      const m1 = sinon.fake(async (ctx, next) => {
        const result = await next()
        return result.concat(['m1'])
      })
      const m2 = sinon.fake(async (ctx, next) => {
        const result = await next()
        return result.concat(['m2'])
      })
      s.use(m1)
      s.use(m2)
      const result = await s.dispatch('fn1')
      expect(fn1.calledOnce).to.equal(true)
      expect(result).to.eql(['fn1', 'm2', 'm1'])
    })

    it('omit calling fn and other middlewares', async () => {
      const s = new Store()
      const fn1 = sinon.fake.resolves('fn1')
      const m1 = sinon.fake(() => {
        return 'm1'
      })
      const m2 = sinon.fake((ctx, next) => {
        return next()
      })
      s.define('fn1', fn1)
      s.use(m1)
      s.use(m2)
      const result = await s.dispatch('fn1')
      expect(result).to.equal('m1')
      expect(fn1.called).to.equal(false)
      expect(m1.calledOnce).to.equal(true)
      expect(m2.called).to.equal(false)
    })

    it('throw error on duplicate next execution in middleware #1', async () => {
      const s = new Store()
      const fn1 = sinon.fake.resolves()
      s.define('fn1', fn1)
      s.use(async (ctx, next) => {
        await next()
        await next()
      })
      let error
      try {
        await s.dispatch('fn1')
      } catch (err) {
        error = err
      }
      expect(fn1.calledOnce).to.equal(true)
      expect(error).to.be.instanceOf(errors.InternalError)
      expect(error.getOriginalError().message).to.equal('next() called more than once')
    })

    it('throw error on duplicate next execution in middleware #2', async () => {
      const s = new Store()
      const fn1 = sinon.fake.resolves()
      s.define('fn1', fn1)
      s.use(async (ctx, next) => {
        await next()
      })
      const m2 = sinon.fake(async (ctx, next) => {
        await next()
        await next()
      })
      s.use(m2)

      let error

      try {
        await s.dispatch('fn1')
      } catch (err) {
        error = err
      }

      expect(fn1.calledOnce).to.equal(true)
      expect(m2.calledOnce).to.equal(true)
      expect(error).to.be.instanceOf(errors.InternalError)
      expect(error.getOriginalError().message).to.equal('next() called more than once')
    })

    it('handle error from middleware', async () => {
      const s = new Store()
      const fn1 = sinon.fake.resolves()
      s.define('fn1', fn1)
      const m1 = sinon.fake(async (ctx, next) => {
        await next()
      })
      const m2 = sinon.fake(async (ctx, next) => {
        throw new Error('test error')
      })
      const m3 = sinon.fake(async (ctx, next) => {
        await next()
      })
      s.use(m1)
      s.use(m2)
      s.use(m3)

      let error
      try {
        await s.dispatch('fn1')
      } catch (err) {
        error = err
      }

      expect(error).to.be.instanceOf(errors.InternalError)
      expect(error.getOriginalError().message).to.equal('test error')
      expect(fn1.called).to.equal(false)
      expect(m1.calledOnce).to.equal(true)
      expect(m2.calledOnce).to.equal(true)
      expect(m3.called).to.equal(false)
    })
  })
})
