'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')

createTerminus(server, {
  healthChecks: {
    '/health': () => Promise.resolve()
  },
  sendFailuresDuringShutdown: false,
  onSendFailureDuringShutdown: async () => {
    console.log('onSendFailureDuringShutdown')
  },
  beforeShutdown: () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }
})

server.listen(8000, () => {
  process.kill(process.pid, 'SIGTERM')
})
