# backend-store

Backend store manages business logic functions in Node.js backend application.

* It allows to define functions and to call them each other through the store
* It allows to use custom middleware executed before each function call
* It has built-in set of business logic error classes
* It has built-in few simple yet powerful plugins

What it's trying to solve:

* Simplifies code organisation
* Simplifies code testing
* Simplifies error handling
* Simplifies logging and error tracking

## Install

```sh
$ yarn add backend-store
```

## Usage

```js
import { Store } from 'backend-store'
import logger from 'backend-store/plugins/logger'
import { join } from 'path'

const store = new Store()

store.plugin(logger)

store.define('api/users/create', async (payload = {}, { context, errors, dispatch }) {
  if (!context || !context.user || context.user.role !== 'admin') {
    throw new errors.AuthorizationError('Only admin can create posts')
  }
  const post = await dispatch('database/users/insert', {
    title: payload.title,
    userId: context.user.id
  })
  return post
})

store.define('database/users/insert', async ({ title, userId }) {
  return {
    id: 1,
    title,
    userId
  }
})

store.dispatch('api/users/create', { title: 'hello!' }, {
  user: { role: 'admin' }
}).then(post => {
  console.log(post)
})
```

More examples in docs

## Docs

https://alekbarszczewski.github.io/backend-store.

## TODO

* ow - label arguments (waiting for ow package to be updated)
