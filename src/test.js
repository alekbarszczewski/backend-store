const Store = require('./Store')
const logger = require('./plugins/logger')

const store = new Store()

store.plugin(logger, { /* options */ })

store.use(async (payload, { log }, next) => {
  log.info('Hello from middleware #1')
  const result = await next(payload)
  log.info('Hello from middleware #2')
})

store.define('api/createPost', async (payload, { dispatch, log }) => {
  log.info('Hello from method #1')
  await dispatch('auth/requireAdmin')
  await dispatch('db/insertPost')
  log.info('Hello from method #2')
  // ...
})

store.define('db/insertPost', async () => {
  // ...
})

store.define('auth/requireAdmin', async () => {
  // ...
})

store.dispatch('api/createPost')
