'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { Terminus } = require('../../')

// eslint-disable-next-line
new Terminus(server, {
  healthChecks: {
    '/health': () => Promise.reject(new Error('failure'))
  },
  onSendFailureDuringShutdown: async () => {
    console.log('onSendFailureDuringShutdown')
  }
})

server.listen(8000, () => {
  setTimeout(() => process.kill(process.pid, 'SIGTERM'), 600)
})
