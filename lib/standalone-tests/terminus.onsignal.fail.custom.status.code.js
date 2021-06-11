'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')
const SIGNAL = 'SIGINT'

createTerminus(server, {
  healthChecks: {
    '/health': () => Promise.resolve()
  },
  signal: SIGNAL,
  beforeShutdown: () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  },
  statusError: 501
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
