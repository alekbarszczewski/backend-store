/* eslint-env mocha */

const chai = require('chai')
const errors = require('./../src/errors')

chai.use(require('chai-uuid'))
chai.use(require('chai-as-promised'))
const expect = chai.expect

const testErrors = [
  {
    ErrorCls: errors.AuthenticationError,
    message: 'Authentication error',
    type: 'authentication',
    severity: 'warning',
    statusCode: 401
  },
  {
    ErrorCls: errors.AuthorizationError,
    message: 'Authorization error',
    type: 'authorization',
    severity: 'warning',
    statusCode: 403
  },
  {
    ErrorCls: errors.InternalError,
    message: 'Internal error',
    type: 'internal',
    severity: 'error',
    statusCode: 500
  },
  {
    ErrorCls: errors.NotFoundError,
    message: 'Not found error',
    type: 'notFound',
    severity: 'warning',
    statusCode: 404
  },
  {
    ErrorCls: errors.NotImplementedError,
    message: 'Not implemented error',
    type: 'notImplemented',
    severity: 'error',
    statusCode: 503
  },
  {
    ErrorCls: errors.ValidationError,
    message: 'Validation error',
    type: 'validation',
    severity: 'warning',
    statusCode: 400
  }
]

const AppError = errors.AppError

describe('errors', () => {
  testErrors.forEach(testError => {
    it(testError.ErrorCls.name, () => {
      const err1 = new testError.ErrorCls()
      expect(err1).to.be.instanceOf(errors.AppError)
      expect(err1.message).to.equal(testError.message)
      expect(err1.type).to.equal(testError.type)
      expect(err1.severity).to.equal(testError.severity)
      expect(err1.statusCode).to.equal(testError.statusCode)
      expect(err1.err).to.equal(null)
      expect(err1.data).to.equal(null)
      expect(err1.reasons).to.equal(null)
      expect(err1.hasReasons()).to.equal(false)
      const originalErr = new Error('test')
      const data = {}
      const err2 = new testError.ErrorCls({
        message: 'abc',
        type: 'abc',
        severity: 'abc',
        statusCode: 999,
        err: originalErr,
        data
      }).addReason({ path: 'path1', message: 'message1' }).addReason([{ path: 'path2', message: 'message2' }])
      expect(err1.toJSON()).to.eql({
        type: testError.type,
        severity: testError.severity,
        message: testError.message,
        reasons: null
      })
      expect(err2).to.be.instanceOf(errors.AppError)
      expect(err2.message).to.equal('abc')
      expect(err2.type).to.equal(testError.type)
      expect(err2.severity).to.equal(testError.severity)
      expect(err2.statusCode).to.equal(testError.statusCode)
      expect(err2.err).to.equal(originalErr)
      expect(err2.data).to.equal(data)
      expect(err2.reasons).to.eql([{ path: 'path1', message: 'message1' }, { path: 'path2', message: 'message2' }])

      expect(err2.getOriginalError()).to.equal(originalErr)
      expect(err2.getType()).to.equal(testError.type)
      expect(err2.getSeverity()).to.equal(testError.severity)
      expect(err2.getStatusCode()).to.equal(testError.statusCode)
      expect(err2.getData()).to.equal(data)
      expect(err2.getReasons()).to.eql([{ path: 'path1', message: 'message1' }, { path: 'path2', message: 'message2' }])
      expect(err2.hasReasons()).to.equal(true)
      expect(err2.toJSON()).to.eql({
        type: testError.type,
        severity: testError.severity,
        message: 'abc',
        reasons: [{ path: 'path1', message: 'message1' }, { path: 'path2', message: 'message2' }]
      })

      const err3 = new testError.ErrorCls('mainMessage', {
        message: 'abc',
        type: 'abc',
        severity: 'abc',
        statusCode: 999,
        err: originalErr,
        data
      })

      expect(err3.message).to.equal('mainMessage')
      expect(err3.type).to.equal(testError.type)
      expect(err3.severity).to.equal(testError.severity)
      expect(err3.statusCode).to.equal(testError.statusCode)
      expect(err3.err).to.equal(originalErr)
      expect(err3.data).to.equal(data)
    })
  })

  describe('wrapError', () => {
    it('return err if err evaluates to false', () => {
      const falsyValues = [undefined, null, false, 0]
      falsyValues.forEach(falsyValue => {
        expect(errors.wrapError(falsyValue)).to.equal(falsyValue)
      })
    })

    it('return err if err instance of AppError', () => {
      testErrors.forEach(({ ErrorCls }) => {
        const err = new ErrorCls()
        expect(errors.wrapError(err)).to.equal(err)
      })
    })

    it('return InternalError if err is not instance of AppError', () => {
      const err = new Error('test error')
      const wrappedError = errors.wrapError(err)
      expect(wrappedError).to.be.instanceOf(errors.InternalError)
      expect(wrappedError.getOriginalError()).to.equal(err)
      expect(wrappedError.message).to.equal('Internal error')
    })
  })

  describe('AppError', () => {
    describe('::normalizeOptions', () => {
      it('normalizeOptions', () => {
        const normalizeOptions = errors.AppError.normalizeOptions
        expect(normalizeOptions()).to.eql({})
        expect(normalizeOptions({})).to.eql({})
        expect(normalizeOptions('msg')).to.eql({ message: 'msg' })
        expect(normalizeOptions('msg', { a: 'b' })).to.eql({ message: 'msg', a: 'b' })
        expect(normalizeOptions('msg', { message: 'abc', a: 'b' })).to.eql({ message: 'msg', a: 'b' })
        expect(normalizeOptions({ message: 'abc', a: 'b' })).to.eql({ message: 'abc', a: 'b' })
      })
    })

    describe('#constructor', () => {
      it('support options', () => {
        const err1 = new AppError()
        expect(err1.message).to.equal('App error')
        expect(err1.err).to.equal(null)
        expect(err1.type).to.equal('internal')
        expect(err1.severity).to.equal('error')
        expect(err1.statusCode).to.equal(500)
        expect(err1.data).to.equal(null)
        expect(err1.reasons).to.equal(null)

        const originalErr = new Error('error')
        const data = {}
        const reasons = {}
        const err2 = new AppError({
          message: 'abc1',
          err: originalErr,
          type: 'abc2',
          severity: 'abc3',
          statusCode: 999,
          data,
          reasons
        })
        expect(err2.message).to.equal('abc1')
        expect(err2.err).to.equal(originalErr)
        expect(err2.type).to.equal('abc2')
        expect(err2.severity).to.equal('abc3')
        expect(err2.statusCode).to.equal(999)
        expect(err2.data).to.equal(data)
        expect(err2.reasons).to.equal(null)
      })

      it('allow to pass message as first arg', () => {
        const data2 = {}
        const err1 = new AppError('msg1')
        const err2 = new AppError('msg2', { data: data2 })
        const err3 = new AppError('msg3', { message: 'abc' })
        expect(err1.message).to.equal('msg1')
        expect(err2.message).to.equal('msg2')
        expect(err2.data).to.equal(data2)
        expect(err3.message).to.equal('msg3')
      })

      it('throw error on invalid args(s)', () => {
        expect(() => {
          throw new AppError({ message: 123 })
        }).to.throw(/Any predicate failed with the following errors/)
        expect(() => {
          throw new AppError({ err: 123 })
        }).to.throw(/Any predicate failed with the following errors/)
        expect(() => {
          throw new AppError({ type: 123 })
        }).to.throw(/Any predicate failed with the following errors/)
        expect(() => {
          throw new AppError({ severity: 123 })
        }).to.throw(/Any predicate failed with the following errors/)
        expect(() => {
          throw new AppError({ statusCode: 'abc' })
        }).to.throw(/Any predicate failed with the following errors/)
      })
    })

    describe('#getOriginalError', () => {
      it('return original error', () => {
        const originalErr = new Error()
        const err1 = new AppError()
        const err2 = new AppError({ err: originalErr })
        expect(err1.getOriginalError()).to.equal(null)
        expect(err2.getOriginalError()).to.equal(originalErr)
      })
    })

    describe('#getType', () => {
      it('return type', () => {
        const err1 = new AppError()
        const err2 = new AppError({ type: 'abc' })
        expect(err1.getType()).to.equal('internal')
        expect(err2.getType()).to.equal('abc')
      })
    })

    describe('#getSeverity', () => {
      it('return severity', () => {
        const err1 = new AppError()
        const err2 = new AppError({ severity: 'abc' })
        expect(err1.getSeverity()).to.equal('error')
        expect(err2.getSeverity()).to.equal('abc')
      })
    })

    describe('#getStatusCode', () => {
      it('return status code', () => {
        const err1 = new AppError()
        const err2 = new AppError({ statusCode: 999 })
        expect(err1.getStatusCode()).to.equal(500)
        expect(err2.getStatusCode()).to.equal(999)
      })
    })

    describe('#getData', () => {
      it('return data', () => {
        const data = {}
        const err1 = new AppError()
        const err2 = new AppError({ data })
        expect(err1.getData()).to.equal(null)
        expect(err2.getData()).to.equal(data)
      })
    })

    describe('#getReasons', () => {
      it('return reasons', () => {
        const err1 = new AppError()
        const err2 = new AppError().addReason({ path: 'path1', message: 'message1' })
        expect(err1.getReasons()).to.eql(null)
        expect(err2.getReasons()).to.eql([{ path: 'path1', message: 'message1' }])
      })
    })

    describe('#addReason', () => {
      it('add resons(s)', () => {
        const err1 = new AppError()
        const err2 = new AppError()
          .addReason({ path: 'path1', message: 'message1' })
          .addReason([{ path: 'path2', message: 'message2' }, { path: 'path3', message: 'message3' }])
        expect(err1.reasons).to.equal(null)
        expect(err2.reasons).to.eql([
          { path: 'path1', message: 'message1' },
          { path: 'path2', message: 'message2' },
          { path: 'path3', message: 'message3' }
        ])
      })

      it('add custom fields to reason', () => {
        const err1 = new AppError()
        const err2 = new AppError()
          .addReason({ path: 'path1', message: 'message1', custom1: 123, custom2: 'test' })
          .addReason([{ path: 'path2', message: 'message2', custom1: 123, custom2: 'test' }, { path: 'path3', message: 'message3', custom1: 123, custom2: 'test' }])
        expect(err1.reasons).to.equal(null)
        expect(err2.reasons).to.eql([
          { path: 'path1', message: 'message1', custom1: 123, custom2: 'test' },
          { path: 'path2', message: 'message2', custom1: 123, custom2: 'test' },
          { path: 'path3', message: 'message3', custom1: 123, custom2: 'test' }
        ])
      })

      it('throw error on invalid arg(s)', () => {
        const err = new AppError()

        const invalidArgs = [
          { path: 'abc', message: 123 },
          { path: 123, message: 'abc' },
          { path: 'abc' },
          { message: 'abc' },
          {},
          'abc',
          123,
          [{ path: 'abc', message: 123 }],
          [{ path: 123, message: 'abc' }],
          [{ path: 'abc' }],
          [{ message: 'abc' }],
          [{}],
          ['abc'],
          [123]
        ]

        invalidArgs.forEach(arg => {
          expect(() => {
            err.addReason(invalidArgs)
          }).to.throw(/^Expected `reason.message` to be of type `string` but received type/)
        })
      })
    })

    describe('#hasReasons', () => {
      it('return true if there are any resons', () => {
        const err1 = new AppError()
        const err2 = new AppError()
          .addReason({ path: 'path1', message: 'message1' })
        expect(err1.hasReasons()).to.equal(false)
        expect(err2.hasReasons()).to.equal(true)
      })
    })

    describe('#toJSON', () => {
      it('convert error to JSON', () => {
        const originalErr = new Error('test')
        const data = {}
        const err1 = new AppError({
          message: 'abc1',
          type: 'abc2',
          severity: 'abc3',
          statusCode: 999,
          err: originalErr,
          data
        }).addReason({ path: 'path1', message: 'message1' })
        expect(err1.toJSON()).to.eql({
          type: 'abc2',
          severity: 'abc3',
          message: 'abc1',
          reasons: [{ path: 'path1', message: 'message1' }]
        })
      })
    })
  })
})
