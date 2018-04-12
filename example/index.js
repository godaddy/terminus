const express = require('express')
const http = require('http')
const terminus = require('../lib/terminus')
const app = express()

app.get('/', (req, res) => {
  setTimeout(() => {
    res.send('ok')
  }, 100000)
})

terminus(http.createServer(app), {
  logger: console.log,
  healthChecks: {
    '/healthz': () => Promise.resolve()
  }
}).listen(3000)
