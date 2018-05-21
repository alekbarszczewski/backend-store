# AppError

AppError is a base class of all errors.

## #constructor(options)

**Arguments**:

| Argument           | Type          | Description
|--------------------|---------------|-----------------------
| [options]          | `object`      | Error options
| options.message    | `string`      | Error message
| options.type       | `string`      | Error type
| options.severity   | `string`      | Error severity
| options.error      | `Error`       | Original error
| options.statusCode | `integer`     | Error HTTP status code
| options.data       | `any`         | Custom error data

## #addReason(reason)

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

## #getReasons()

Return list of reasons added to error instance

**Return**:

`Array<object>` - see addReason documentation above for details

## #getType()

Return type of error

**Return**:

`string`

## #getSeverity()

Return severity of error

**Return**:

`string` - default errors have severity "error" or "warning"

## #getOriginalError()

Return original error

**Return**:

`Error` - original error passed to AppError constructor

## #getStatusCode()

Return statusCode of error

**Return**:

`integer` - statusCode of error

## #getData()

Return error custom data

**Return**:

`any` - custom data passed to AppError constructor

## #toJSON()

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
