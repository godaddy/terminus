'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const terminus = require('../terminus')
const SIGINT = 'SIGINT'
const SIGTERM = 'SIGTERM'
const SIGUSR2 = 'SIGUSR2'
const SIGNALS = [SIGINT, SIGTERM, SIGUSR2]

terminus(server, {
  signals: SIGNALS,
  onSignal: () => {
    console.log('on-sigint-runs')
    return Promise.resolve()
  },
  onShutdown: () => {
    console.log('on-shutdown-runs')
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGINT)
})
