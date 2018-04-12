const express = require('express')
const http = require('http')
const { Client } = require('pg')
const terminus = require('../../lib/terminus')
const app = express()
const client = new Client({
  database: 'terminus',
  user: 'test',
  password: 'test'
})

app.get('/', async (req, res) => {
  const result = await client.query('SELECT $1::text as message', ['Hello world!'])
  res.send(result.rows[0].message)
})

async function onHealthCheck () {
  return client.query('SELECT 1')
}

function onSignal () {
  console.log('server is starting cleanup')
  return client.end().then(() => console.log('client has disconnected'))
    .catch(err => console.error('error during disconnection', err.stack))
}

async function startServer () {
  await client.connect()
  console.log('db connected')

  terminus(http.createServer(app), {
    logger: console.log,
    signal: 'SIGINT',
    healthChecks: {
      '/healthcheck': onHealthCheck
    },

    onSignal
  }).listen(3000)
}

startServer()
  .catch(err => console.error('connection error', err.stack))
