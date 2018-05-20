/* eslint-env mocha */

const chai = require('chai')
const sinon = require('sinon')
const path = require('path')
const CaptureStdout = require('capture-stdout')
const Store = require('./../../src/Store')
const logger = require('./../../src/plugins/logger')

chai.use(require('chai-uuid'))
chai.use(require('chai-as-promised'))
const expect = chai.expect

const defaultLogCheck = (log, { cid, when = 'before', method, logName = 'app', level = 30, seq = 0, source = 'auto', stack }) => {
  expect(log.cid).to.be.a.uuid('v4').and.to.equal(cid)
  expect(log.hostname).to.be.a('string')
  expect(log.level).to.equal(level)
  expect(log.method).to.equal(method)
  expect(log.when).to.equal(when)

  if (when === 'before') {
    expect(log.msg.indexOf(`before_${method}`)).to.equal(0)
  } else if (when === 'after') {
    expect(log.msg.indexOf(`after_${method}`)).to.equal(0)
  }

  expect(log.v).to.equal(0)
  expect(log.pid).to.be.a('number')
  expect(log.seq).to.equal(seq)
  expect(log.source).to.equal(source)
  expect(log.stack).to.eql(stack)
  // TODO time
}

describe('plugins/logger', () => {

  beforeEach(function () {
    this.s = new Store()
    this.capture = new CaptureStdout()
    this.capture.startCapture()
    this.getLog = () => {
      this.capture.stopCapture()
      const captured = this.capture.getCapturedText()
      return captured.map(line => JSON.parse(line))
    }
  })

  it('log methods', async function () {
    this.s.plugin(logger)
    this.s.define('fn1', () => {})
    const payload = { title: 'abc' }
    const context = { user: 123 }
    await this.s.dispatch('fn1', payload, context)
    const lines = this.getLog()
    expect(lines.length).to.equal(2)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]
    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
    defaultLogCheck(lines[1], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
  })

  it('log nested methods', async function () {
    this.s.plugin(logger)
    this.s.define('fn1', (payload, { dispatch }) => dispatch('fn2'))
    this.s.define('fn2', (payload, { dispatch }) => dispatch('fn3'))
    this.s.define('fn3', () => {})
    const payload = { title: 'abc' }
    const context = { user: 123 }
    await this.s.dispatch('fn1', payload, context)
    const lines = this.getLog()
    expect(lines.length).to.equal(6)
    const cid = lines[0].cid
    const stack = []

    const beforeFns = ['fn1', 'fn2', 'fn3']
    beforeFns.forEach((fn, index) => {
      stack.push({
        cid,
        seq: index,
        method: 'fn' + (index + 1)
      })
      defaultLogCheck(lines[index], {
        when: 'before',
        method: fn,
        cid,
        seq: index,
        stack
      })
    })

    const afterFns = ['fn3', 'fn2', 'fn1']
    afterFns.forEach((fn, index) => {
      const lineIndex = index + 3
      const seq = 2 - index
      defaultLogCheck(lines[lineIndex], {
        when: 'after',
        method: fn,
        cid,
        seq,
        stack
      })
      stack.pop()
    })
  })

  it('support name option', async function () {
    this.s.plugin(logger, { name: 'abc' })
    this.s.define('fn1', () => {})
    await this.s.dispatch('fn1')
    const lines = this.getLog()
    expect(lines.length).to.equal(2)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]
    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      logName: 'abc'
    })
    defaultLogCheck(lines[1], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      logName: 'abc'
    })
  })

  it('support bunyan option', async function () {
    this.s.plugin(logger, { bunyan: { customOption: 123, src: true } })
    this.s.define('fn1', () => {})
    await this.s.dispatch('fn1')
    const lines = this.getLog()
    expect(lines.length).to.equal(2)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]
    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
    defaultLogCheck(lines[1], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
    expect(lines[0].customOption).to.equal(123)
    expect(lines[1].customOption).to.equal(123)
    expect(lines[0].src).to.be.a('object')
    expect(lines[1].src).to.be.a('object')
  })


  it('support customData option', async function () {
    const spy = sinon.fake(({ middlewareContext }) => {
      return {
        someOption: 'abc',
        methodName: middlewareContext.method
      }
    })
    const middleware = sinon.fake((payload, ctx, next) => next(payload))
    this.s.use(middleware)
    this.s.plugin(logger, {
      customData: spy
    })
    this.s.define('fn1', () => {})
    await this.s.dispatch('fn1')
    const lines = this.getLog()
    expect(lines.length).to.equal(2)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]
    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
    defaultLogCheck(lines[1], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
    expect(lines[0].someOption).to.equal('abc')
    expect(lines[0].methodName).to.equal('fn1')
    expect(lines[1].someOption).to.equal('abc')
    expect(lines[1].methodName).to.equal('fn1')

    const middlewareCtx = middleware.firstCall.args[1]
    expect(spy.calledTwice).to.equal(true)

    const logCtx1 = spy.firstCall.args[0]
    const logCtx2 = spy.secondCall.args[0]

    expect(logCtx1.when).to.equal('before')
    expect(logCtx1.err).to.equal(undefined)
    expect(logCtx1.middlewareContext).to.equal(middlewareCtx)
    // TODO startTime

    expect(logCtx2.when).to.equal('after')
    expect(logCtx2.err).to.equal(undefined)
    expect(logCtx2.middlewareContext).to.equal(middlewareCtx)
    // TODO startTime
  })

  it('support customData option with err', async function () {
    const spy = sinon.fake(({ middlewareContext }) => {
      return {
        someOption: 'abc',
        methodName: middlewareContext.method
      }
    })
    const middleware = sinon.fake((payload, ctx, next) => next(payload))
    this.s.use(middleware)
    this.s.plugin(logger, {
      customData: spy
    })
    const error = new Error('abc')
    this.s.define('fn1', () => {
      throw error
    })
    try {
      await this.s.dispatch('fn1')
    } catch (err) {
    }
    const lines = this.getLog()
    expect(lines.length).to.equal(2)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]
    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
    defaultLogCheck(lines[1], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      level: 50
    })
    expect(lines[0].someOption).to.equal('abc')
    expect(lines[0].methodName).to.equal('fn1')
    expect(lines[1].someOption).to.equal('abc')
    expect(lines[1].methodName).to.equal('fn1')

    const middlewareCtx = middleware.firstCall.args[1]
    expect(spy.calledTwice).to.equal(true)

    const logCtx1 = spy.firstCall.args[0]
    const logCtx2 = spy.secondCall.args[0]

    expect(logCtx1.when).to.equal('before')
    expect(logCtx1.err).to.equal(undefined)
    expect(logCtx1.middlewareContext).to.equal(middlewareCtx)
    // TODO startTime

    expect(logCtx2.when).to.equal('after')
    expect(logCtx2.err).to.equal(error)
    expect(logCtx2.middlewareContext).to.equal(middlewareCtx)
    // TODO startTime
  })

  it('support customLogLevel option', async function () {
    const spy = sinon.fake(({ middlewareContext }) => {
      return 'warn'
    })
    const middleware = sinon.fake((payload, ctx, next) => next(payload))
    this.s.use(middleware)
    this.s.plugin(logger, {
      customLogLevel: spy
    })
    this.s.define('fn1', () => {})
    await this.s.dispatch('fn1')
    const lines = this.getLog()
    expect(lines.length).to.equal(2)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]
    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      level: 40
    })
    defaultLogCheck(lines[1], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      level: 40
    })

    const middlewareCtx = middleware.firstCall.args[1]
    expect(spy.calledTwice).to.equal(true)

    const logCtx1 = spy.firstCall.args[0]
    const logCtx2 = spy.secondCall.args[0]

    expect(logCtx1.when).to.equal('before')
    expect(logCtx1.err).to.equal(undefined)
    expect(logCtx1.middlewareContext).to.equal(middlewareCtx)
    // TODO startTime

    expect(logCtx2.when).to.equal('after')
    expect(logCtx2.err).to.equal(undefined)
    expect(logCtx2.middlewareContext).to.equal(middlewareCtx)
    // TODO startTime
  })

  it('log in method and middleware', async function () {
    this.s.plugin(logger)
    const middleware = sinon.fake((payload, ctx, next) => {
      ctx.log.warn('Msg from middleware')
      next(payload)
    })
    this.s.use(middleware)
    this.s.define('fn1', (payload, { log }) => {
      log.warn({ some: 'data' }, 'Some message')
    })
    await this.s.dispatch('fn1')
    const lines = this.getLog()
    expect(lines.length).to.equal(4)
    const cid = lines[0].cid
    const stack = [{
      cid,
      seq: 0,
      method: 'fn1'
    }]

    defaultLogCheck(lines[0], {
      when: 'before',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })

    defaultLogCheck(lines[1], {
      when: 'middleware',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      level: 40,
      source: 'user'
    })

    defaultLogCheck(lines[2], {
      when: 'inside',
      method: 'fn1',
      cid,
      seq: 0,
      stack,
      level: 40,
      source: 'user'
    })
    expect(lines[2].some).to.equal('data')
    expect(lines[2].msg).to.equal('Some message')

    defaultLogCheck(lines[3], {
      when: 'after',
      method: 'fn1',
      cid,
      seq: 0,
      stack
    })
  })
})
