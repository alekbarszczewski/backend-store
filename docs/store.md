# Store

## #define(name, fn, [meta])

Define new method in the store.

**Arguments**:

| Argument | Type       | Description
|----------|------------|------------
| name     | `string`   | Method name.
| fn       | `function` | Method function (described [here](/method-function.md)).
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
It may return any value or Promise<any>. Method function is described [here](/method-function.md).

"meta" argument is optional and it is used to associate some user-defined meta data with a defined function.
It may be used by plugin (see plugins), by middleware (see middlewareContext) or by method itself (see methodContext).

## #use(fn)

Add new middleware to store.

**Arguments**:

| Argument | Type       | Description
|----------|------------|------------
| fn       | `function` | Middleware function of type `(payload, middlewareContext, next) => (any or Promise<any>)`.

**Return**:

`Store` - Store instance itself for chaining like this `store.use(...).use(...)`

**Description**:

Middleware function is executed before each executed method and it takes following arguments:
* **payload** - payload passed to `store.dispatch(...)`. It might be modified or completely replaced by another middleware.
* **middlewareContext** - context passed to each middleware executed before method.
* **next** - Calls next middleware(s) and finally method itself.
