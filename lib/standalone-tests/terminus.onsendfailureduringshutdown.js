'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { Terminus } = require('../../')

const terminus = new Terminus(server, {
  healthChecks: {
    '/health': () => Promise.resolve()
  },
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
