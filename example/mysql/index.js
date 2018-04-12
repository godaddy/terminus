const express = require('express')
const http = require('http')
const mysql = require('mysql')
const terminus = require('../../lib/terminus')
const app = express()
const db = mysql.createConnection({
  database: 'terminus',
  user: 'test',
  password: 'test'
})

app.get('/', (req, res) => {
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.send(`Solution = ${results[0].solution}`)
  })
})

function onHealthCheck () {
  return new Promise((resolve, reject) => {
    db.query('SELECT 1', (err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

function onSignal () {
  console.log('server is starting cleanup')

  return new Promise((resolve, reject) => {
    db.end((err) => {
      if (err) {
        console.error('error during disconnection', err.stack)
        return reject(err)
      }
      console.log('db has disconnected')
      return resolve()
    })
  })
}

db.connect((err) => {
  if (err) {
    return console.error('connection error', err.stack)
  }

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
