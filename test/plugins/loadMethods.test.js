/* eslint-env mocha */

const chai = require('chai')
const sinon = require('sinon')
const path = require('path')
const Store = require('./../../src/Store')
const loadMethods = require('./../../src/plugins/loadMethods')

chai.use(require('chai-uuid'))
chai.use(require('chai-as-promised'))
const expect = chai.expect

describe('plugins/loadMethods', () => {
  it('load store from directory', async () => {
    const s = new Store()
    s.plugin(loadMethods, { path: path.join(__dirname, 'fakeStores/store1') })
    await expect(s.dispatch('test1')).eventually.eql(['test1'])
    await expect(s.dispatch('test2')).eventually.eql(['test2'])
    await expect(s.dispatch('nested1/test1')).eventually.eql(['nested1/test1'])
    await expect(s.dispatch('nested1/test2')).eventually.eql(['nested1/test2'])
    await expect(s.dispatch('nested1/nested2/test1')).eventually.eql(['nested1/nested2/test1'])
    await expect(s.dispatch('nested1/nested2/test3')).eventually.eql(['nested1/nested2/test3'])
  })

  it('load empty store', async () => {
    const s = new Store()
    expect(() => {
      s.plugin(loadMethods, { path: path.join(__dirname, 'fakeStores/store4') })
    }).to.not.throw()
    expect(s.methods.size).to.equal(0)
  })

  it('load empty store with empty folders', async () => {
    const s = new Store()
    expect(() => {
      s.plugin(loadMethods, { path: path.join(__dirname, 'fakeStores/store5') })
    }).to.not.throw()
    expect(s.methods.size).to.equal(0)
  })

  it('ignore files that dont export function', async () => {
    const s = new Store()
    expect(() => {
      s.plugin(loadMethods, { path: path.join(__dirname, 'fakeStores/store6') })
    }).to.not.throw()
    expect(s.methods.size).to.equal(0)
  })

  it('respect filter option', async () => {
    const s = new Store()
    const filter = sinon.fake(({ relativePath }) => {
      return relativePath.match(/^nested1/)
    })
    s.plugin(loadMethods, {
      path: path.join(__dirname, 'fakeStores/store1'),
      filter
    })
    await expect(s.dispatch('test1')).to.be.rejectedWith(/not defined/)
    await expect(s.dispatch('test2')).to.be.rejectedWith(/not defined/)
    await expect(s.dispatch('nested1/test1')).eventually.eql(['nested1/test1'])
    await expect(s.dispatch('nested1/test2')).eventually.eql(['nested1/test2'])
    await expect(s.dispatch('nested1/nested2/test1')).eventually.eql(['nested1/nested2/test1'])
    await expect(s.dispatch('nested1/nested2/test3')).eventually.eql(['nested1/nested2/test3'])

    const calls = []
    for (let i = 0; i < filter.callCount; ++i) {
      calls.push(filter.getCall(i).args[0])
    }
    const checkCall = calls.find(({ relativePath }) => relativePath === 'nested1/nested2/test3.js')
    expect(checkCall.relativePath).to.equal('nested1/nested2/test3.js')
    expect(checkCall.fileName).to.equal('test3.js')
    expect(checkCall.moduleName).to.equal('test3')
    expect(checkCall.namespace).to.equal('nested1/nested2')
    expect(checkCall.filePath.indexOf(checkCall.relativePath)).to.not.equal(-1)
  })

  it('throw error on invalid or missing path option', async () => {
    const s = new Store()
    const invalidPaths = [
      true,
      123,
      {},
      [],
      null,
      undefined
    ]
    invalidPaths.forEach(invalidPath => {
      expect(() => {
        s.plugin(loadMethods, { path: invalidPath })
      }).to.throw(/^Expected `options.path` to be of type `string` but received type/)
    })
    expect(() => {
      s.plugin(loadMethods)
    }).to.throw(/^Expected `options.path` to be of type `string` but received type/)
  })

  it('throw error if path is invalid or points to non-directory', async () => {
    const s = new Store()
    expect(() => {
      s.plugin(loadMethods, { path: path.join(__dirname, '/invalid-store-path') })
    }).to.throw(/ENOENT/)
    expect(() => {
      s.plugin(loadMethods, { path: path.join(__dirname, '/fakeStores/store1/test1.js') })
    }).to.throw(/^Directory .+ does not exist$/)
  })

  it('throw error on invalid filter option', async () => {
    const s = new Store()
    const invalidFilters = [
      'abc',
      true,
      123,
      {},
      []
    ]
    invalidFilters.forEach(invalidFilter => {
      expect(() => {
        s.plugin(loadMethods, { path: path.join(__dirname, 'fakeStores/store1'), filter: invalidFilter })
      }).to.throw(/^Expected `options.filter` to be of type `Function` but received type/)
    })
  })

  it('throw error on duplicate method', async () => {
    const s = new Store()
    expect(() => {
      s.plugin(loadMethods, { path: path.join(__dirname, '/fakeStores/store2') })
    }).to.throw(/Method 'abc' is already defined/)
  })
})
