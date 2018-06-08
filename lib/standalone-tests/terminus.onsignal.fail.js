'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const terminus = require('../terminus')
const SIGNAL = 'SIGINT'

terminus(server, {
  healthChecks: {
    '/health': () => Promise.resolve()
  },
  signal: SIGNAL,
  beforeShutdown: () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
