'use strict'
const http = require('http')
const server1 = http.createServer((req, res) => res.end('hello1'))
const server2 = http.createServer((req, res) => res.end('hello2'))
const server3 = http.createServer((req, res) => res.end('hello3'))

const { createTerminus } = require('../../')

createTerminus(server1, {
  onSignal: () => {
    console.log('server1:onSignal')
    return Promise.resolve()
  }
})
createTerminus(server2, {
  onSignal: () => {
    console.log('server2:onSignal')
    return Promise.resolve()
  }
})
createTerminus(server3, {
  onSignal: () => {
    console.log('server3:onSignal')
    return Promise.resolve()
  }
})

new Promise((resolve) => {
  let counter = 3
  const handle = () => {
    counter -= 1
    if (counter <= 0) { resolve() }
  }
  server1.listen(8000, handle)
  server2.listen(8001, handle)
  server3.listen(8002, handle)
})
  .then(() => process.kill(process.pid, 'SIGTERM'))
