const { addMiddleware } = require('graphql-add-middleware')
const { makeExecutableSchema } = require('graphql-tools')
const errors = require('./../../src/errors')
const store = require('./store')

const typeDefs = `
  enum ErrorType { internal, authentication, authorization, notFound, notImplemented, validation }
  enum ErrorSeverity { error, warning }

  type ErrorReason {
    path: String!
    message: String!
    reason: String
  }

  type Error {
    type: ErrorType!
    severity: ErrorSeverity!
    message: String!
    reasons: [ErrorReason!]
  }

  input PostCreateInput {
    title: String!
    content: String!
  }

  type Post {
    id: Int!
    title: String!
    content: String!
    userId: Int!
  }

  type PostCreateResult {
    post: Post!
  }

  type PostCreateOutput {
    result: PostCreateResult
    error: Error
  }

  type PostQuery {
    create (input: PostCreateInput!): PostCreateOutput!
  }

  type Query {
    Post: PostQuery
  }
`

const resolvers = {
  Post: {
    async create (root, args, context, info) {
      return {
        post: await store.dispatch('api/posts/create', args.input, context)
      }
    }
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

addMiddleware(schema, async function (root, args, context, info, next) {
  try {
    if (context.reqError) {
      throw context.reqError
    }
    return {
      result: await next()
    }
  } catch (err) {
    err = errors.wrapError(err)
    return {
      error: err.toJSON()
    }
  }
})

export default schema
