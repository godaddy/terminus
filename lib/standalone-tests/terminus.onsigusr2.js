'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const terminus = require('../terminus')
const SIGNAL = 'SIGUSR2'

terminus(server, {
  signal: SIGNAL,
  onSignal: () => {
    console.log('on-sigusr2-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
