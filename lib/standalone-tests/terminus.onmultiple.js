'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const terminus = require('../terminus')
const SIGNALS = ['SIGUSR2','SIGINT', 'SIGTERM']
const SIGNAL = process.argv[2];

terminus(server, {
  signal: SIGNAL,
  onSignal: () => {
    console.log('on-' + SIGNAL.toLowerCase() + '-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
