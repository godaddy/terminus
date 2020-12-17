const express = require('express')
const http = require('http')
const oracledb = require('oracledb')
const terminus = require('../../lib/terminus')
const app = express()

const config = {
  user: process.env.NODE_ORACLEDB_USER || 'scott',
  password: process.env.NODE_ORACLEDB_PASSWORD || 'tiger',
  connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || 'localhost:1521/XE',
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1
}

async function dbConnect () {
  await oracledb.createPool(config)
  await oracledb.getConnection()
}

app.get('/dual', async (req, res) => {
  const conn = await oracledb.getConnection()
  const result = await conn
    .execute('select JSON_OBJECT(\'id\' value sys_guid()) from dual')
  res.json(result.rows[0])
})

async function onHealthCheck () {
  const conn = await oracledb.getConnection()
  console.log('pinging oracle db')
  return conn.ping()
}

function onSignal () {
  console.log('server is starting cleanup')
  oracledb.getPool().close().then(() => console.log('Oracle database connection closed'))
    .catch(err => console.error('error during disconnection', err.stack))
}

async function startServer () {
  // get oracle connection
  await dbConnect()
  console.log('Oracle database connection established')

  terminus.createTerminus(http.createServer(app), {
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
