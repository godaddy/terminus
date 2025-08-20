'use strict'

const http = require('http')
const { createTerminus } = require('@godaddy/terminus')

// Create basic HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Server is running\n')
})

// Set up graceful shutdown with signal parameter
createTerminus(server, {
  signal: 'SIGTERM',
  onSignal: (signal) => {
    console.log(`Received signal: ${signal}`)
    console.log('Starting graceful shutdown...')

    // You can now track which signal triggered the shutdown
    // for observability and monitoring purposes
    if (signal === 'SIGTERM') {
      console.log('Shutting down due to SIGTERM (likely from process manager)')
    } else if (signal === 'SIGINT') {
      console.log('Shutting down due to SIGINT (likely from Ctrl+C)')
    }

    return Promise.resolve()
  },
  onShutdown: () => {
    console.log('Server shutdown complete')
    return Promise.resolve()
  }
})

server.listen(3000, () => {
  console.log('Server listening on port 3000')
  console.log('Send SIGTERM or SIGINT to trigger graceful shutdown')
})
