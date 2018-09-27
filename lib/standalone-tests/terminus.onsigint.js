'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')
const SIGNAL = 'SIGINT'

createTerminus(server, {
  signal: SIGNAL,
  onSignal: () => {
    console.log('on-sigint-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
