'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { Terminus } = require('../../')

const terminus = new Terminus(server, {
  onSignal: () => {
    console.log('on-sigterm-runs')
    return Promise.resolve()
  }
})

server.listen(8000, () => {
  process.kill(process.pid, 'SIGTERM')
})
