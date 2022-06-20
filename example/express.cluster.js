/*
Proper cluster setup with graceful shutdown.
In this example we run express with cluster, also we shutdown each worker properly.
node example/express.cluster.js
Then you can kill workers with kill -15 {PID FROM LOG}
and see how they will be shutdown and recreated.
If you run the same command on the master process, all workers will be shutdown.
*/

// -------

const express = require('express')
const cluster = require('cluster')
const http = require('http')
const cpus = require('os').cpus
const process = require('process')
const terminus = require('../lib/terminus').createTerminus

function run () {
  const app = express()
  // Setup your express here
  // Last in line, nothing else responded
  app.use((req, res) => {
    res.status(404).send('Sorry!')
  })
  const server = http.createServer(app)
  const terminusOptions = {
    useExit0: true,
    beforeShutdown: () => {
      // https://github.com/godaddy/terminus#how-to-set-terminus-up-with-kubernetes
      const waitMS = 10_000 // default periodSeconds of livenessProbe
      console.log('received SIGTERM')
      console.log(`waiting ${waitMS} milliseconds for readinessCheck to fail`)
      return new Promise(resolve => {
        setTimeout(resolve, waitMS)
      })
    },
    onSignal: () => {
      console.log('starting cleanup')
      return Promise.resolve()
    },
    onShutdown: () => {
      console.log('BYE!')
      return Promise.resolve()
    }
  }
  terminus(server, terminusOptions)
  server.listen(8080, () => {
    console.log(`Express worker with PID: ${process.pid} started.`)
  })
}

/**
 * Shutdown the cluster workers properly
 */
async function gracefulClusterShutdown () {
  console.log('Starting graceful cluster shutdown')
  shuttingDownServer = true
  await shutdownWorkers('SIGTERM')
  console.log('Successfully finished graceful cluster shutdown')
  process.exit(0)
}

/**
 * Shutdown all worker processes.
 * From https://medium.com/@gaurav.lahoti/graceful-shutdown-of-node-js-workers-dd58bbff9e30
 * @param signal Signal to send to the workers
 */
function shutdownWorkers (signal) {
  return new Promise((resolve) => {
    if (!cluster.isMaster) { return resolve() }
    const wIds = Object.keys(cluster.workers)
    if (wIds.length === 0) { return resolve() }
    // Filter all the valid workers
    const workers = wIds.map(id => cluster.workers[id]).filter(v => v)
    let workersAlive = 0
    let funcRun = 0
    // Count the number of alive workers and keep looping until the number is zero.
    const fn = () => {
      ++funcRun
      workersAlive = 0
      workers.forEach(worker => {
        if (!worker.isDead()) {
          ++workersAlive
          if (funcRun === 1) {
          // On the first execution of the function, send the received signal to all the workers
          // https://github.com/nodejs/node-v0.x-archive/issues/6042#issuecomment-168677045
            worker.process.kill(signal)
          }
        }
      })
      console.log(workersAlive + ' workers alive')
      if (workersAlive === 0) {
        // Clear the interval when all workers are dead
        clearInterval(interval)
        return resolve()
      }
    }
    const interval = setInterval(fn, 1000)
  })
}

// Startup code
// NodeJS is single threaded, how many CPUs/Threads do we want to use?
const numCPUs = cpus().length
let shuttingDownServer = false
if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`)
  console.log(`Detected ${numCPUs} CPUs => same amount of threads will be started`)
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker, code, signal) => {
    if (!shuttingDownServer) {
      console.log(`Worker ${worker.process.pid} died. Forking a new one...`)
      cluster.fork()
    }
  })
  // Graceful shutdown of all workers
  process.on('SIGTERM', gracefulClusterShutdown)
} else {
  run()
  console.log(`Worker ${process.pid} started`)
}
