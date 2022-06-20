'use strict'
const http = require('http')
const server = http.createServer((req, res) => res.end('hello'))

const { createTerminus } = require('../../')

createTerminus(server, {
  useExit0: (process.argv[2] === 'true')
})

server.listen(8000, () => {
  process.kill(process.pid, 'SIGTERM')
})
