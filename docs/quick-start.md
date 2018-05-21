# Quick Start

## Install
```sh
$ yarn add backend-store
```

## Usage
```js
import { Store } from 'backend-store'

const store = new Store()

// use middleware - it will be executed before each method
store.use(async (payload, middlewareContext, next) => {
  // do something before...
  try {
    const result = await next(payload)
    // do something after
    return result
  } catch (err) {
    // do something on error...
    throw err
  }
})

// define method
store.define('api/createPost', async ({ title, content }, { dispatch, context }) => {
  await dispatch('auth/checkRole', { role: 'admin' })
  const post = await dispatch('db/insertPost', { title, content, creatorId: context.user.id })
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    creatorId: post.creatorId
  }
})

// define method
store.define('db/insertPost', async ({ title, content, creatorId }, { errors }) => {
  const result = await knex('posts')
  .insert({ title, content, creatorId })
  .returning('*')
  return result[0]
})

// define method
store.define('auth/checkRole', async ({ role }, { context, errors }) => {
  if (!context.user) {
    throw new errors.AuthenticationError('You have to be logged in')
  } else if (context.user.role !== role) {
    throw new errors.AuthorizationError('Only admin has access to this resource')
  }
})

// call method
store.dispatch('api/createPost', {
  title: 'Hello',
  content: 'Lorem ipsum...'
}, {
  user: { id: 123, role: 'admin' }
}).then(post => {
  console.log(post)
})
```

Check out [Reference](/store.md) for more details.
