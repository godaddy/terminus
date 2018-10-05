'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { Terminus } = require('../../')
const SIGNAL = process.argv[2]

// eslint-disable-next-line
new Terminus(server, {
  signal: SIGNAL,
  onSignal: () => {
    console.log('on-' + SIGNAL.toLowerCase() + '-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
