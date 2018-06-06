# logger

Adds automatic logging of executed method and adds `log` object to each method and middleware context.
It uses [bunyan](https://github.com/trentm/node-bunyan) under the hood.

## Usage

```js
import { Store } from 'backend-store'
import logger from 'backend-store/plugins/logger'
// or const logger = require('backend-store/plugins/logger')

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
```

The console output will be:

```js
// automatically logged before method api/createPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":0,
  "method":"api/createPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"}
  ],
  "level":30,
  "source":"auto",
  "when":"before",
  "msg":"before_api/createPost",
  "time":"2018-05-22T09:21:35.383Z",
  "v":0
}

// message from middleware executed before api/createPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":0,
  "method":"api/createPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"}
  ],
  "source":"user",
  "when":"middleware",
  "level":30,
  "msg":"Hello from middleware #1",
  "time":"2018-05-22T09:21:35.385Z",
  "v":0
}

// message from inside of api/createPost method
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":0,
  "method":"api/createPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"}
  ],
  "source":"user",
  "when":"inside",
  "level":30,
  "msg":"Hello from method #1",
  "time":"2018-05-22T09:21:35.385Z",
  "v":0
}

// automatically logged before method auth/requireAdmin
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":1,
  "method":"auth/requireAdmin",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":1,"method":"auth/requireAdmin"}
  ],
  "level":30,
  "source":"auto",
  "when":"before",
  "msg":"before_auth/requireAdmin",
  "time":"2018-05-22T09:21:35.386Z",
  "v":0
}

// message from middleware executed before auth/requireAdmin
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":1,
  "method":"auth/requireAdmin",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":1,"method":"auth/requireAdmin"}
  ],
  "source":"user",
  "when":"middleware",
  "level":30,
  "msg":"Hello from middleware #1",
  "time":"2018-05-22T09:21:35.386Z",
  "v":0
}

// message from middleware executed after auth/requireAdmin
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":1,
  "method":"auth/requireAdmin",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":1,"method":"auth/requireAdmin"}
  ],
  "source":"user",
  "when":"middleware",
  "level":30,
  "msg":"Hello from middleware #2",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// automatically logged after method auth/requireAdmin
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":1,
  "method":"auth/requireAdmin",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":1,"method":"auth/requireAdmin"}
  ],
  "level":30,
  "source":"auto",
  "when":"after",
  "ms":2,
  "msg":"after_auth/requireAdmin (2ms)",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// automatically logged before method db/insertPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":2,
  "method":"db/insertPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":2,"method":"db/insertPost"}
  ],
  "level":30,
  "source":"auto",
  "when":"before",
  "msg":"before_db/insertPost",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// message from middleware executed before db/insertPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":2,
  "method":"db/insertPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":2,"method":"db/insertPost"}
  ],
  "source":"user",
  "when":"middleware",
  "level":30,
  "msg":"Hello from middleware #1",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// message from middleware executed after db/insertPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":2,
  "method":"db/insertPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":2,"method":"db/insertPost"}
  ],
  "source":"user",
  "when":"middleware",
  "level":30,
  "msg":"Hello from middleware #2",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// automatically logged after method db/insertPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":2,
  "method":"db/insertPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"},
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":2,"method":"db/insertPost"}
  ],
  "level":30,
  "source":"auto",
  "when":"after",
  "ms":0,
  "msg":"after_db/insertPost (0ms)",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// another message from inside of api/createPost method
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":0,
  "method":"api/createPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"}
  ],
  "source":"user",
  "when":"inside",
  "level":30,
  "msg":"Hello from method #2",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// message from middleware executed after api/createPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":0,
  "method":"api/createPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"}
  ],
  "source":"user",
  "when":"middleware",
  "level":30,
  "msg":"Hello from middleware #2",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}

// automatically logged after method api/createPost
{
  "name":"app",
  "hostname":"Someones-MacBook-Pro.local",
  "pid":44077,
  "cid":"39040fc0-f68e-4b8a-8227-3b469f040410",
  "seq":0,
  "method":"api/createPost",
  "stack":[
    {"cid":"39040fc0-f68e-4b8a-8227-3b469f040410","seq":0,"method":"api/createPost"}
  ],
  "level":30,
  "source":"auto",
  "when":"after",
  "ms":6,
  "msg":"after_api/createPost (6ms)",
  "time":"2018-05-22T09:21:35.388Z",
  "v":0
}
```


## Options

| Option           | Type       | Description
|------------------|------------|--------------------------
| [name]           | `string`   | Logger name passed to bunyan.createLogger(...). Defaults to `"app"`.
| [bunyan]         | `object`   | Other options passed to bunyan.createLogger(...).
| [customData]     | `function` | Function to log some extra data
| [customLogLevel] | `function` | Function to customise bunyan log level

**customData**

Function of type `(LogContext) => object`.
Whenever something is logged this functions is executed with [LogConext](/logger.md?id=log-context).
It must return object which properties will be added to log data.

```js
// example

store.plugin(logger, {
  customData ({ err, middlewareContext: { meta, context } }) {
    const customData = {}
    // add user to custom log data
    customData.user = context ? context.user : null

    if (err && err.some && err.some.property) {
      // add some property of err to custom data
      customData.someProperty = err.some.property
    }
    return customData
  }
})
```

**customLogLevel**

Function of type `(LogContext) => string | null`.
Whenever something is logged this functions is executed with [LogConext](/logger.md?id=log-context).
It must return bunyan log level which will be used to log in this case or it might return something that evaluates to false - in such case default log level will be used (see below).
For list of all bunyan log levels please refer [here](https://github.com/trentm/node-bunyan#levels).


Default log level is determined in following way:

* when logContext.err is NOT present then "info" log level is used
* when logContext.err is present then
  * if logContext.err is instanceof AppError then
    * if logContext.err.severity is "error" then "error" log level is used
    * if logContext.err.severity is "warning" then "warn" log level is used
  * if logContext.err is NOT instanceof AppError then "error" log level is used

```js
// example

store.plugin(logger, {
  customLogLevel ({ err, middlewareContext: { meta } }) {
    if (err) {
      // if error occured always use "error" log level
      return 'error'
    } else if (meta && meta.debug) {
      // if executed method has debug flag in it's meta data then use "debug" log level
      return 'debug'
    } else {
      // use default log level
      return null
    }
  }
})
```

## Log context

Log context is passed to [customData](/logger.md?id=options) and [customLogLevel](/logger.md?id=options) functions.

| Property          | Type                | Description
|-------------------|---------------------|----------------------------------------------
| when              | `string`            | "before" or "inside" or "after"
| startTime         | `Date`              | Date instance
| err               | `Error`             | Error if occured (may be null)
| middlewareContext | `MiddlewareContext` | [MiddlewareContext](/store.md?id=middleware-context)
| payload           | `any`               | Payload passed to executed method
