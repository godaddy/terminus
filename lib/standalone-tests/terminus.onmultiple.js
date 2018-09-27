'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')
const SIGNAL = process.argv[2]

createTerminus(server, {
  signal: SIGNAL,
  onSignal: () => {
    console.log('on-' + SIGNAL.toLowerCase() + '-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
