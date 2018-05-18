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

const defaultLogCheck = (log, { before, method, logName = 'app', level = 30 }) => {
  expect(log.cid).to.be.a.uuid('v4')
  expect(log.hostname).to.be.a('string')
  expect(log.level).to.equal(level)
  expect(log.method).to.equal(method)
  if (before) {
    expect(log.when).to.equal('before')
    expect(log.msg.indexOf(`before_${method}`)).to.equal(0)
  } else {
    expect(log.when).to.equal('after')
    expect(log.msg.indexOf(`aftere_${method}`)).to.equal(0)
  }
  expect(log.v).to.equal(0)
  expect(log.pid).to.be.a('integer')
}

//      -    "pid": 26186
//      -    "seq": 0
//      -    "source": "auto"
//      -    "stack": [
//      -      {
//      -        "cid": "8b003512-eb9e-40bf-bd1b-5b5c2f45f5d1"
//      -        "method": "fn1"
//      -        "seq": 0
//      -      }
//      -    ]
//      -    "time": "2018-05-18T21:41:03.733Z"

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
    defaultLogCheck(lines[0])
    defaultLogCheck(lines[1])
  })

  it('log nested methods')
  it('name option')
  it('bunyan options')
  it('custom data')
  it('custom log level')
  it('log in context')
})
