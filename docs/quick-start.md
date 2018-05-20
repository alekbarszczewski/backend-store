# Quick Start

## Install
```sh
$ yarn add backend-store
```

## Usage
```js
import { Store } from 'backend-store'

const store = new Store()

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

store.define('db/insertPost', async ({ title, content, creatorId }, { errors }) => {
  const result = await knex('posts')
  .insert({ title, content, creatorId })
  .returning('*')
  return result[0]
})

store.define('auth/checkRole', async ({ role }, { context, errors }) => {
  if (!context.user) {
    throw new errors.AuthenticationError('You have to be logged in')
  } else if (context.user.role !== role) {
    throw new errors.AuthorizationError('Only admin has access to this resource')
  }
})

store.dispatch('api/createPost', {
  title: 'Hello',
  content: 'Lorem ipsum...'
}, {
  user: { id: 123, role: 'admin' }
}).then(post => {
  console.log(post)
})
```

## Define methods

Methods can be defined by using `Store#defineMethod(name, fn, meta)`.

**Name** (required) argument is a method name, and it has some restrictions:
* name may consist of one or more parts separated with "/" character
* each part must consist of at least one character
* each part must start with [a-zA-Z_] and can be followed by any number of [a-zA-Z_0-9] characters

```js
// some valid method names
store.define('api/createPost', ...)
store.define('doSomething', ...)
store.define('api/posts/create', ...)
store.define('a', ...)
store.define('a/b/c9_', ...)

// some invalid method names
store.define('', ...)
store.define('1doSomething', ...)
store.define('api//p', ...)
store.define('/a', ...)
store.define('b/', ...)
store.define('a b c', ...)
```

**Fn** (required) argument is a function that receives two arguments:
* payload
* methodContext

And returns result or promise

**Meta** (optional) can be of any type and it's user supplied data that is stored along with the function in store
and can be used by plugins and middlewares.

**Example**
```js
store.defineMethod('api/createPost', async (payload, methodContext) => {
  ...
}, { customData: 123 })
```

#### Method context

Method context is an object passed to executed method along with a payload argument.
It consists of following properties:

| Property | Type     | Description
|----------|----------|------------
| context  | any      | User defined context passed to `store.dispatch(method, payload, context)`
| cid      | any      | Chain id is id of current execution chain (it defaults to UUID string but it may be customised by user)
| seq      | integer  | Sequence number of executed method (0, 1, 2, ...)
| meta     | any      | Meta data of executed method
| error    | object   | Application errors dictionary
| stack    | array    | Current method call stack
| dispatch | function | Function to execute other method defined in store (`dispatch(method, payload)`)

## Dispatch methods

## Use middleware

#### Middleware context

## Use plugins
