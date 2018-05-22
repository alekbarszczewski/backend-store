/* eslint-env mocha */

const chai = require('chai')
const { Store, errors, __esModule: __esModule1 } = require('./../index')
const Store2 = require('./../src/Store')
const errors2 = require('./../src/errors')
const logger = require('./../plugins/logger')
const loadMethods = require('./../plugins/loadMethods')
const logger2 = require('./../src/plugins/logger')
const loadMethods2 = require('./../src/plugins/loadMethods')
// const { __esModule: __esModule2 } = require('./../plugins/logger')
// const { __esModule: __esModule3 } = require('./../plugins/loadMethods')

const expect = chai.expect

describe('exports', () => {
  it('export Store, errors and plugins', () => {
    expect(Store).to.equal(Store2)
    expect(errors).to.equal(errors2)
    expect(logger).to.equal(logger2)
    expect(loadMethods).to.equal(loadMethods2)
    expect(logger.default).to.equal(logger)
    expect(loadMethods.default).to.equal(loadMethods)
    expect(__esModule1).to.equal(true)
    // expect(__esModule2).to.equal(true) TODO
    // expect(__esModule3).to.equal(true) TODO
  })
})
