const express = require('express')
const expressJwt = require('express-jwt')
const graphqlHTTP = require('express-graphql')
const errors = require('./../../src/errors')
const executableSchema = require('./graphql')

const app = express()

const graphql = graphqlHTTP({
  schema: executableSchema,
  graphiql: false
})

app.use(expressJwt({
  secret: 'test',
  credentialsRequired: false
}))

app.post('/graphql', graphql)

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    req.reqError = new errors.AuthenticationError({
      message: err.message
    })
    graphql(req, res, next)
  } else {
    next()
  }
})

module.exports = app
