const express = require('express')
const http = require('http')
const Redis = require('ioredis')
const terminus = require('../../lib/terminus')

const app = express()
let redisClient = {}

function onHealthCheck () {
  return redisClient.status === 'ready' ? Promise.resolve() : Promise.reject(new Error('not ready'))
}

function onSignal () {
  console.log('server is starting cleanup')
  return redisClient
    .quit()
    .then(() => console.log('redis disconnected'))
    .catch(err => console.error('error during disconnection', err.stack))
}

async function startServer () {
  redisClient = new Redis({
    port: 6379, // Redis port
    host: '127.0.0.1' // Redis host
  })

  // OR
  // redisClient = new Redis.Cluster(/* options */);

  redisClient.on('connect', () => console.log('redis connected'))

  terminus(http.createServer(app), {
    logger: console.log,
    signal: 'SIGINT',
    healthChecks: {
      '/healthcheck': onHealthCheck
    },
    onSignal
  }).listen(3000)
}

startServer().catch(err => console.error('connection error', err.stack))
