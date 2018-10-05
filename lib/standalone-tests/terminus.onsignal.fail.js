'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { Terminus } = require('../../')
const SIGNAL = 'SIGINT'

// eslint-disable-next-line
new Terminus(server, {
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
