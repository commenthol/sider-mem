const express = require('express')
const redis = require('redis')
const session = require('express-session')

const RedisStore = require('connect-redis')(session)

const html = {
  page: (body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Views</title>
</head>
<body>
${body}
</body>
</html>
`,
  index: ({ views }) => html.page(views
    ? `<p>views: ${views}</p>`
    : '<p>welcome to the session demo. refresh!</p>'
  )
}

function app (opts) {
  const { host, port, ttl = 60 } = opts || {}

  const redisClient = redis.createClient({ host, port })
  const app = express()

  redisClient.on('error', (err) => console.error('redis error %s', err))

  app.use(
    session({
      store: new RedisStore({ client: redisClient, ttl }),
      saveUninitialized: true,
      secret: 'keyboard cat',
      resave: true
    })
  )
  app.use((req, res, next) => {
    if (!req.session) {
      next(new Error('no session'))
      return
    }
    next()
  })
  app.get('/favicon.ico', (req, res) => {
    res
      .set({
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'max-age=300'
      })
      .end(Buffer.from('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', 'base64'))
  })
  app.get('/', function (req, res, next) {
    const { views = 0 } = req.session
    req.session.views = views + 1
    // res.setHeader('Content-Type', 'text/html')
    res.type('html').end(html.index({ views }))
  })
  return app
}

module.exports = { app }
