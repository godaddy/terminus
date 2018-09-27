'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')

createTerminus(server, {
  onSignal: () => {
    console.log('on-sigterm-runs')
    return Promise.resolve()
  },
  onShutdown: () => {
    console.log('on-shutdown-runs')
  }
})

server.listen(8000, () => {
  process.kill(process.pid, 'SIGTERM')
})
