const Store = require('./Store').Store
const loadMethods = require('./plugins/loadMethods')
const logger = require('./plugins/logger')

const store = new Store()
store.plugin(loadMethods, { path: __dirname + '/../test/plugins/fakeStores/store1' })
store.plugin(logger, {
  name: 'test',
  customData ({ middlewareContext }) {
    return {
      user: middlewareContext.context.user || null
    }
  }
})
store.dispatch('nested1/nested2/test3', { title: 'abc' }, { user: { id: 1, role: 'admin' } })
