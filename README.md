
[![Join Slack](https://img.shields.io/badge/Join%20us%20on-Slack-e01563.svg)](https://godaddy-oss-slack.herokuapp.com/)

[![Build Status](https://travis-ci.org/godaddy/terminus.svg?branch=master)](https://travis-ci.org/godaddy/terminus)

[![Greenkeeper badge](https://badges.greenkeeper.io/godaddy/terminus.svg)](https://greenkeeper.io/)

# terminus

Adds graceful shutdown and Kubernetes readiness / liveness checks for any HTTP applications.

## Installation

Install via npm:

```console
$ npm i @godaddy/terminus --save
```

## Usage

```javascript
const http = require('http');
const { createTerminus } = require('@godaddy/terminus');

function onSignal () {
  console.log('server is starting cleanup');
  return Promise.all([
    // your clean logic, like closing database connections
  ]);
}

function onShutdown () {
  console.log('cleanup finished, server is shutting down');
}

function healthCheck () {
  return Promise.resolve(
    // optionally include a resolve value to be included as
    // info in the healthcheck response
  )
}

const server = http.createServer((request, response) => {
  response.end(
    `<html>
      <body>
        <h1>Hello, World!</h1>
       </body>
     </html>`
   );
})

const options = {
  // healtcheck options
  healthChecks: {
    '/healthcheck': healthCheck    // a promise returning function indicating service health
  },

  // cleanup options
  timeout: 1000,                   // [optional = 1000] number of milliseconds before forcefull exiting
  signal,                          // [optional = 'SIGTERM'] what signal to listen for relative to shutdown
  signals,                         // [optional = []] array of signals to listen for relative to shutdown
  beforeShutdown,                  // [optional] called before the HTTP server starts its shutdown
  onSignal,                        // [optional] cleanup function, returning a promise (used to be onSigterm)
  onShutdown,                      // [optional] called right before exiting
  onSendFailureDuringShutdown,     // [optional] called before sending each 503 during shutdowns

  // both
  logger                           // [optional] logger function to be called with errors
};

createTerminus(server, options);

server.listen(PORT || 3000);
```

### With custom error messages

```js
const http = require('http');
const { createTerminus, HealthCheckError } = require('@godaddy/terminus');

createTerminus(server, {
  healthChecks: {
    '/healthcheck': async function () {
      const errors = []
      return Promise.all([
        // all your healthchecks goes here
      ].map(p => p.catch((error) => {
        // silently collecting all the errors
        errors.push(error)
        return undefined
      }))).then(() => {
        if (errors.length) {
          throw new HealthCheckError('healtcheck failed', errors)
        }
      })
    }
  }
});
```

### With express

```javascript
const http = require('http');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('ok');
});

const server = http.createServer(app);

const options = {
  // opts
};

createTerminus(server, options);

server.listen(PORT || 3000);
```

### With koa

```javascript
const http = require('http');
const Koa = require('koa');
const app = new Koa();

const server = http.createServer(app.callback());

const options = {
  // opts
};

createTerminus(server, options);

server.listen(PORT || 3000);
```

## How to set Terminus up with Kubernetes?

When Kubernetes or a user deletes a Pod, Kubernetes will notify it and wait for `gracePeriod` seconds before killing it.

During that time window (30 seconds by default), the Pod is in the `terminating` state and will be removed from any Services by a controller. The Pod itself needs to catch the `SIGTERM` signal and start failing any readiness probes.

> If the ingress controller you use route via the Service, it is not an issue for your case. At the time of this writing, we use the nginx ingress controller which routes traffic directly to the Pods.

During this time, it is possible that load-balancers (like the nginx ingress controller) don't remove the Pods "in time", and when the Pod dies, it kills live connections.

To make sure you don't lose any connections, we recommend delaying the shutdown with the number of milliseconds that's defined by the readiness probe in your deployment configuration. To help with this, terminus exposes an option called `beforeShutdown` that takes any Promise-returning function.

```javascript
function beforeShutdown () {
  // given your readiness probes run every 5 second
  // may be worth using a bigger number so you won't
  // run into any race conditions
  return new Promise(resolve => {
    setTimeout(resolve, 5000)
  })
}
createTerminus(server, {
  beforeShutdown
})
```

[Learn more](https://github.com/kubernetes/contrib/issues/1140#issuecomment-231641402)

## Limited Windows support

Due to inherent platform limitations, `terminus` has limited support for Windows.
You can expect `SIGINT` to work, as well as `SIGBREAK` and to some extent `SIGHUP`.
However `SIGTERM` will never work on Windows because killing a process in the task manager is unconditional, i.e., there's no way for an application to detect or prevent it.
Here's some relevant documentation from [`libuv`](https://github.com/libuv/libuv) to learn more about what `SIGINT`, `SIGBREAK` etc. signify and what's supported on Windows - http://docs.libuv.org/en/v1.x/signal.html.
Also, see https://nodejs.org/api/process.html#process_signal_events.
