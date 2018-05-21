# Store

## #constructor
```js
import { Store } from 'backend-store'

const store = new Store() // takes no args
```

## #define(name, fn, [meta])

Define new method in the store.

**Arguments**:

| Argument | Type       | Description
|----------|------------|------------
| name     | `string`   | Method name.
| fn       | `function` | [Method function](/method-function.md)
| [meta]   | `any`      | User-defined meta data related to that method. It may be used by plugin, middleware or by the method itself.

**Return**:

`Store` - Store instance itself for chaining like this `store.defineMethod(...).defineMethod(...)`

**Description**:

"name" argument restrictions:
* name may consist of one or more parts separated with "/" character
* each part must consist of at least one character
* each part must start with [a-zA-Z_] and can be followed by any number of [a-zA-Z_0-9] characters

```js
// valid method name examples
store.define('api/createPost', ...)
store.define('doSomething', ...)
store.define('api/posts/create', ...)
store.define('a', ...)
store.define('a/b/c9_', ...)

// invalid method name examples
store.define('', ...)
store.define('1doSomething', ...)
store.define('api//p', ...)
store.define('/a', ...)
store.define('b/', ...)
store.define('a b c', ...)
```

"fn" argument must be a function that takes two arguments: payload and [methodContext](/method-context.md).
It may return any value or Promise<any>. Method function is described in details here: [Method function](/method-function.md).

"meta" argument is optional and it is used to associate some user-defined meta data with a defined function.
It may be used by plugin (see plugins), by middleware (see middlewareContext) or by method itself (see methodContext).

**Example**:

```js
store.define('api/createPost', async (payload, methodContext) => {
  const { title, content } = payload
  const { context, dispatch } = methodContext
  const result = await disptach('db/createPost', { title, content, authorId: context.user.id })
  return result
}, { some: 'meta-data' })
```

## #use(fn)

Add new middleware to store.

**Arguments**:

| Argument | Type       | Description
|----------|------------|------------
| fn       | `function` | [Middleware function](/middleware-function.md)

**Return**:

`Store` - Store instance itself for chaining like this `store.use(...).use(...)`

**Description**:

Middleware function is executed before each executed method.
It may be used to modify payload before execution of other middlewares and method function.
It may be used to modify output of method function.
It may be used for logging and error handling.

**Example**:

```js
const myMiddleware = async (payload, middlewareContext, next) => {
  const { method } = middlewareContext
  console.log(`before ${method}`)
  try {
    const result = await next(payload)
    console.log(`after ${method}`)
    return result
  } catch (err) {
    console.log(`error ${method}`)
    throw err
  }
}

store.use(myMiddleware)
```

Middleware function is described in details here: [Middleware function](/middleware-function.md).

## #plugin(fn, options)

Use a plugin on store instance.

**Arguments**:

| Argument  | Type       | Description
|-----------|------------|------------
| fn        | `function` | [Plugin function](/plugin-function.md)
| [options] | `any`      | Plugin options passed to plugin function along with store instance

**Return**:

`any` - result of plugin function

**Description**:

It's just a helper to define some standard of using plugins with backend-store.

**Example**:

```js
const myPlugin = (store, options = {}) => {
  if (options.log) {
    store.use(async (payload, middlewareContext, next) => {
      console.log(`before ${middlewareContext.method}`)
      try {
        await next(payload)
        console.log(`after ${middlewareContext.method}`)
      } catch (err) {
        console.error(`error ${middlewareContext.method}`)
      }
    })
  }
}

store.plugin(myPlugin, { log: true })
```

Plugin function is described in details here: [Plugin function](/plugin-function.md).

## #dispatch(method, payload, context, options)

Executes method in the store.

**Arguments**:

| Argument      | Type       | Description
|---------------|------------|------------
| method        | `string`   | Method name
| [payload]     | `any`      | Payload passed to method
| [context]     | `any`      | User defined context. Context is shared across all methods executed in single call chain
| [options]     | `object`   | Additional options
| [options.cid] | `string`   | User-defined call chain id. It defaults to random UUID. You can set it to express request id for example.

**Return**:

`Promise<any>` - result of method function

**Description**:

It executes given method along with all middleware defined in the store.

**Example**:

```js
// only method name
await store.dispatch('myMethod')

// method name and payload
await store.dispatch('api/createPost', {
  title: 'abc',
  content: 'Lorem ipsum'
})

// method name, payload and context
await store.dispatch('api/createPost', {
  title: 'abc',
  content: 'Lorem ipsum'
}, { user: { id: 1, role: 'admin' } })

// method name, payload, context and cid option
await store.dispatch('api/createPost', {
  title: 'abc',
  content: 'Lorem ipsum'
}, {
  user: { id: 1, role: 'admin' }
}, { cid: '<call_chain_id>' })
```

## Method function

`(payload, methodContext) => (any | Promise<any>)`

**Arguments**:

| Argument      | Type       | Description
|---------------|------------|------------
| payload       | `any`      | Payload passed to method
| methodContext | `object`   | [Method context](/store.md)

**Return**:

Any value or Promise of any value.

## Method context

Method context is passed as second argument (along with payload) to any executed method.

| Property        | Type       | Description
|-----------------|------------|----------------------------
| dispatch        | `function` | Function to dispatch any other method from the store (`dispatch(method, payload) => Promise<any>`).
| context         | `any`      | User-defined context passed to `Store#dispatch`.
| cid             | `string`   | Call chain id. Defaults to random UUID.
| seq             | `integer`  | Call chain method sequence number.
| meta            | `any`      | User-defined method meta data.
| errors          | `object`   | Errors dictionary.
| stack           | `array`    | Call chain stack.

**dispatch**

Dispatch function passed to method context allows to call other methods in the store from inside of executed method.
It is slightly different that `Store#dispatch` method because it takes only "method" and "payload" args.
Context and options are passed automatically form parent method.

```js
store.define('myMethod1', async (payload, methodContext) => {
  const { dispatch, context } = methodContext
  const result = await dispatch('myMethod2', { some: 'payload' })
  return result
})

store.define('myMethod2', async (payload, methodContext) => {
  const { context } = methodContext
  // context is same as in myMethod2
})

store.dispatch('myMethod1', null, { user: { id: 1, role: 'admin' } })
```

**context**

Context in any value passed to `Store#dispatch` as context argument.
It is also automatically passed to any other methods executed from inside of parent method.
It is a good place to pass data of user who is executing method, or database transaction descriptor.
It can be modified by middleware or by the method itself.

**cid**

Call chain id, default's to random UUID but can be passed as an option to `Store#dispatch` method.
It is used to identify call chain - all methods executed from inside of parent method will have same cid.

```js
// cid in all methods below will be the same

store.define('myMethod1', async (payload, methodContext) => {
  const { cid } = methodContext
  await dispatch('myMethod2')
})

store.define('myMethod2', async (payload, methodContext) => {
  const { cid } = methodContext
  await dispatch('myMethod3')
})

store.define('myMethod3', async (payload, methodContext) => {
  const { cid } = methodContext
})

store.dispatch('myMethod1')
```

**seq**

Method sequence in call chain. Starts as `0` and it's incremented every time another method is executed in a call chain.

```js
store.define('myMethod1', async (payload, methodContext) => {
  const { seq } = methodContext
  // seq = 0
  await dispatch('myMethod2')
})

store.define('myMethod2', async (payload, methodContext) => {
  const { seq } = methodContext
  // seq = 1
  await dispatch('myMethod3')
})

store.define('myMethod3', async (payload, methodContext) => {
  const { seq } = methodContext
  // seq = 2
})

store.dispatch('myMethod1')
```

## Middleware function

## Middleware context

## Plugin function
