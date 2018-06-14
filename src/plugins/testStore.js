const Store = require('./../Store')

function testStorePlugin (store, options = {}) {
  const testStore = new Store()
  testStore.methods = store.methods
  testStore.middleware = [...store.middleware]

  const api = options.api || {}

  testStore.use(async (payload, { method, methodContext, seq }, next) => {
    if (api[method] && seq === 0) {
      const makeRequest = api[method]
      const result = await makeRequest(payload, methodContext)
      return result
    } else {
      return next(payload)
    }
  })

  return testStore
}

module.exports = testStorePlugin
