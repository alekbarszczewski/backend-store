const Store = require('./../../src/Store')

const store = new Store()

store.define('api/posts/create', (payload, { context, errors }) => {

})

store.define('api/posts/collection/insert', (payload, { context }) => {

})

module.exports = store
