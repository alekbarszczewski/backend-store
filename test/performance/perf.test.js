/* eslint-env mocha */

const chai = require('chai')
const { test: pureTest } = require('./pureTest')
const { test: storeTest } = require('./storeTest')

const expect = chai.expect

const iterations = 100000

const test = async (title, fn) => {
  const start = Date.now()
  for (let i = 0; i < iterations; ++i) {
    await fn({})
  }
  const stop = Date.now()
  const total = stop - start
  const average = total / iterations
  // console.log(title, `total = ${total}ms, average = ${average}ms`)
  return { total, average }
}

describe('performance', () => {
  it('add average overhead less than 1ms', async function () {
    this.timeout(60000)
    const { average: avgPure } = await test('pure', pureTest)
    const { average: avgStore } = await test('store', storeTest)
    expect(avgStore - avgPure).to.be.below(1)
  })
})
