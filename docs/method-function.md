# Method function

Method function is passed to [`Store#define(...)`](/store.md).

**Arguments**:

```js
// example method function
store.define('api/createPost', async (payload, methodContext) => {
  const { title, content } = payload
  const { context, dispatch, errors } = methodContext

  if (!context.user || context.user.role !== 'admin') {
    throw new errors.NotAuthorizedError('Only admin can create new post')
  }

  const result = await dispatch('db/insertPost', {
    title,
    content,
    authorId: context.user.id
  })

  return result
}, { public: false })
```
