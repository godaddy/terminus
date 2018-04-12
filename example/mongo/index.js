const express = require('express')
const http = require('http')
const { MongoClient } = require('mongodb')
const terminus = require('../../lib/terminus')
const app = express()

let client
let db

app.get('/', async (req, res) => {
  const result = await db.collection('inserts').insertOne({ a: 1 })
  res.json(result)
})

function onHealthCheck () {
  return db.admin().ping()
}

function onSignal () {
  console.log('server is starting cleanup')
  return client.close().then(() => console.log('client has disconnected'))
    .catch(err => console.error('error during disconnection', err.stack))
}

async function startServer () {
  client = await MongoClient.connect('mongodb://localhost:27017')
  db = client.db('terminus')

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
