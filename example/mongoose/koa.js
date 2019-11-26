const Koa = require('koa')
const http = require('http')
const connection = require('./mongoose')
const terminus = require('../../lib/terminus').createTerminus
const app = new Koa()

function onHealthCheck () {
  // https://mongoosejs.com/docs/api.html#connection_Connection-readyState
  const { readyState } = connection
  // ERR_CONNECTING_TO_MONGO
  if (readyState === 0 || readyState === 3) {
    return Promise.reject(new Error('Mongoose has disconnected'))
  }
  // CONNECTING_TO_MONGO
  if (readyState === 2) {
    return Promise.reject(new Error('Mongoose is connecting'))
  }
  // CONNECTED_TO_MONGO
  return Promise.resolve()
}

function onSignal () {
  console.log('server is starting cleanup')

  return new Promise((resolve, reject) => {
    connection.close(false)
      .then(() => {
        console.info('Mongoose has disconnected')
        resolve()
      })
      .catch(reject)
  })
}

async function startServer () {
  // NOTICE app.callback()
  terminus(http.createServer(app.callback()), {
    logger: console.log,
    signal: 'SIGINT',
    healthChecks: {
      '/healthcheck': onHealthCheck
    },
    onSignal
  }).listen(3001)
}

startServer()
  .catch(err => console.error('connection error', err.stack))
