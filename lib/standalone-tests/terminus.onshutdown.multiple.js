'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')
const SIGNALS = ['SIGUSR2', 'SIGINT', 'SIGTERM']
const SIGNAL = process.argv[2]

createTerminus(server, {
  signals: SIGNALS,
  onSignal: () => {
    console.log('on-' + SIGNAL.toLowerCase() + '-runs')
    return Promise.resolve()
  },
  onShutdown: () => {
    console.log('on-shutdown-runs')
  }
})

server.listen(8000, () => {
  process.kill(process.pid, SIGNAL)
})
