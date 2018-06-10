# Errors

```js
import { errors } from 'backend-store'
// or const { errors } = require('backend-store')
```

!> Note: errors dictionary is also passed automatically to [Method context](/store.md?id=method-context) and [Middleware context](/store.md?id=middleware-Context). So you probably won't have to import it manually.

## Overview

Errors is a dictionary of useful application errors.
All errors inherit from [AppError](/errors.md?id=apperror).

Each error has following properties:

* **message** - error message
* **type** - error type
* **severity** - error severity
* **statusCode** - HTTP statusCode (as a helper if you are implementing REST API)
* **err** - original error
* **data** - custom error data
* **reasons** - error reasons, especially for ValidationError

| Property            | type           | severity | statusCode | Description
|---------------------|----------------|----------|------------|----------------
| AppError            | internal       | error    | 500        | Base class for all errors.
| AuthenticationError | authentication | warning  | 401        | Throw when not logged in user requests resource that requires authentication.
| AuthorizationError  | authorization  | warning  | 403        | Throw when logged in user requests resource that he is not authorized to.
| InternalError       | internal       | error    | 500        | Throw internal / critical error
| NotFoundError       | notFound       | warning  | 404        | Throw when requested resource is not found
| NotImplementedError | notImplemented | error    | 503        | Throw when some part of application is not implemented
| ValidationError     | validation     | warning  | 400        | Throw on any validation error

```js
// Examples

throw new errors.AuthenticationError({ message: 'You have to log in first', data: customData })
throw new errors.AuthorizationError({ message: 'Only admin can create posts', data: customData })

throw new errors.InternalError({
  message: 'Something bad happened',
  data: customData,
  err: originalError
})

throw new errors.NotFoundError({ message: 'User not found', data: customData })
throw new errors.NotImplementedError({ message: 'This method is not implemented yet', data: customData })

throw new errors.ValidationError({
  message: 'Invalid username and phone number',
  data: customData
})
.addReason({ path: 'username', message: 'Minimum 3 characters' })
.addReason({ path: 'phone', message: 'Invalid phone number' })
```

## AppError

AppError is a base class of all errors.

### #constructor(options)

**Arguments**:

| Argument           | Type          | Default value | Description
|--------------------|---------------|---------------|--------
| [options]          | `object`      |               | Error options
| options.message    | `string`      | "App error"   | Error message
| options.type       | `string`      | "internal"    | Error type
| options.severity   | `string`      | "error"       | Error severity
| options.error      | `Error`       |               | Original error
| options.statusCode | `integer`     | 500           | Error HTTP status code
| options.data       | `any`         |               | Custom error data

### #addReason(reason)

**Arguments**:

| Argument           | Type          | Description
|--------------------|---------------|-----------------------
| reason             | `object` or `Array<object>`      | Reason object or array of reason objects

**Return:**

`AppError` instance for chaining like this:

```js
  throw new errors.ValidationError()
  .addReason({ path: 'username', message: 'invalid' })
  .addReason({ path: 'phone', message: 'invalid'})
```

**reason:**

Reason must be an object of type `{ path: '<error_path>', message: '<error_message>' }` or an array of such objects (in such case multiple reasons are added at once).

**Example:**

```js
throw new errors.ValidationError()
.addReason({ path: 'username', message: 'invalid' })
.addReason({ path: 'phone', message: 'invalid'})
.addReason([{ path: 'a', message: 'invalid' }, { path: 'b', message: 'invalid' }])

// ... catch

err.getReasons()

/*
  Will return:
  [
    { path: 'username', message: 'invalid' },
    { path: 'phone', message: 'invalid'},
    { path: 'a', message: 'invalid' },
    { path: 'b', message: 'invalid' }
  ]
*/
```

### #getReasons()

Return list of reasons added to error instance

**Return**:

`Array<object>` - see addReason documentation above for details

### #getType()

Return type of error

**Return**:

`string`

### #getSeverity()

Return severity of error

**Return**:

`string` - default errors have severity "error" or "warning"

### #getOriginalError()

Return original error

**Return**:

`Error` - original error passed to AppError constructor

### #getStatusCode()

Return statusCode of error

**Return**:

`integer` - statusCode of error

### #getData()

Return error custom data

**Return**:

`any` - custom data passed to AppError constructor

### #toJSON()

Format error as JSON object

**Return**:

`object` - error in JSON object representation

```js
const err = new errors.ValidationError({ data: { custom: 123 } })
.addReason({ path: 'path', message: 'msg' })

err.toJSON()

/*
{
  type: 'validation',
  severity: 'warning',
  message: 'Validation error',
  reasons: [{ path: 'path', message: 'msg' }]
}
*/
```

!> Note: error custom data are NOT returned here.
`AppError#toJSON` is for formatting error for end-user and custom error data are for internal use (logging for example).

## AuthenticationError

Throw this error when someone unauthenticated tries to access resource that requires authentication. Extends `AppError`.

**Default options**

| Option      | Value
|-------------|-------
| message     | "Authentication error"
| type        | "authentication"
| severity    | "warning"
| statusCode  | 401

## AuthorizationError

Throw this error when authenticated user tries to access resource that he is no alowed to access. Extends `AppError`.

**Default options**

| Option      | Value
|-------------|-------
| message     | "Authroziation error"
| type        | "authorization"
| severity    | "warning"
| statusCode  | 403

## InternalError

Throw this error on critical / unexpected errors. Extends `AppError`.

**Default options**

| Option      | Value
|-------------|-------
| message     | "Internal error"
| type        | "internal"
| severity    | "error"
| statusCode  | 500

## NotFoundError

Throw this error when requested resource has not been found. Extends `AppError`.

**Default options**

| Option      | Value
|-------------|-------
| message     | "Not found error"
| type        | "notFound"
| severity    | "warning"
| statusCode  | 404

## NotImplementedError

Throw this error when some part of the app logic has not been implemented yet. Extends `AppError`.

**Default options**

| Option      | Value
|-------------|-------
| message     | "Not Implemented error"
| type        | "notImplemented"
| severity    | "error"
| statusCode  | 503

## ValidationError

Throw this error on any validation error(s). Extends `AppError`.

**Default options**

| Option      | Value
|-------------|-------
| message     | "Validation error"
| type        | "validation"
| severity    | "warning"
| statusCode  | 400

## wrapError(err)

`([err]) => AppError`

Wraps any error into AppError.

* if err argument evaluates to false then it returns that falsy value
* if err argument is already instance of AppError it returns that error
* else it returns `new InternalError({ err })`

It's a helper function to convert any error into AppError.
After wrapping error you can safely return `err.toJSON()` to the end user and no crucial information (like call-stack) will leak from backend.

```js
// example 1
import { errors } from 'backend-store'

app.get('/test', (req, res, next) => {
  store.dispatch('test')
  .then(result => {
    res.json(result)
  })
  .catch(err => {
    next(err)
  })
})

app.use((err, req, res, next) => {
  err = errors.wrapError(err)
  res.json(err.toJSON())
})

// example 2
const error = wrapError(null) // error = null
const error = wrapError(false) // error = false
const error = wrapError(new ValidationError()) // error = ValidationError instance
const error = wrapError(new Error('test')) // error = InternalError instance, err.getOriginalError().message = test
```
