const Store = require('./../../src/Store')
const logger = require('./../../src/plugins/logger')

const store = new Store()

store.plugin(logger, {
  bunyan: {
    level: 'fatal'
  }
})

store.define('fn1', async (payload, { dispatch }) => {
  return await dispatch('fn2', payload)
})

store.define('fn2', async (payload, { dispatch }) => {
  return await Promise.all([
    dispatch('fn3', payload),
    dispatch('fn4', payload)
  ])
})

store.define('fn3', async (payload, { dispatch }) => {
  return await dispatch('fn5', payload)
})

store.define('fn4', async (payload, { dispatch }) => {
  return await dispatch('fn5', payload)
})

store.define('fn5', async (payload, { dispatch }) => {
  return true
})

module.exports.test = () => {
  return store.dispatch('fn1', {})
}
