'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const terminus = require('../terminus')
const SIGTERM = 'SIGTERM'

terminus(server, {
  // We don't provide a signals array since it will default to: ['SIGTERM']
  onSignal: () => {
    console.log('on-sigterm-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGTERM)
})
