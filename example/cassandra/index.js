const express = require('express')
const http = require('http')
const cassandra = require('cassandra-driver')
const terminus = require('../../lib/terminus')
const app = express()
const client = new cassandra.Client({ contactPoints: ['127.0.0.1'] })

function onHealthCheck () {
  return client.execute('SELECT now() FROM system.local')
}

async function onSignal () {
  console.log('server is starting cleanup')
  try {
    await client.shutdown()
    console.log('db has disconnected')
  } catch (err) {
    console.error('error during disconnection', err.stack)
    throw err
  }
}

client.connect()
  .then(() => {
    console.log('db connected')

    terminus(http.createServer(app), {
      logger: console.log,
      signal: 'SIGINT',
      healthChecks: {
        '/healthcheck': onHealthCheck
      },

      onSignal
    }).listen(3000)
  })
  .catch(err => {
    console.error('connection error', err.stack)
    client.shutdown()
  })
