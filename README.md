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
const terminus = require('@godaddy/terminus');

function onSignal () {
  console.log('server is starting cleanup');
  return Promise.all([
    // your clean logic, like closing database connections
  ]);
}

function onShutdown () {
  console.log('cleanup finished, server is shutting down');
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
    '/healthcheck': check          // a promise returning function indicating service health
  },

  // cleanup options
  timeout: 1000,                   // [optional = 1000] number of milliseconds before forcefull exiting
  signal,                          // [optional = 'SIGTERM'] what signal to listen for relative to shutdown
  beforeShutdown,                  // [optional] called before the HTTP server starts its shutdown
  onSignal,                        // [optional] cleanup function, returning a promise (used to be onSigterm)
  onShutdown,                      // [optional] called right before exiting

  // both
  logger                           // [optional] logger function to be called with errors
};

terminus(server, options);

server.listen(PORT || 3000);
```

### With express

```javascript
const http = require('http');
const app = express();

app.get('/', (req, res) => {
  res.send('ok');
});

const server = http.createServer(app);

const options = {
  // opts
};

terminus(server, options);

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

terminus(server, options);

server.listen(PORT || 3000);
```

## Limited Windows support

Due to inherent platform limitations, `terminus` has limited support for Windows.
You can expect `SIGINT` to work, as well as `SIGBREAK` and to some extent `SIGHUP`.
However `SIGTERM` will never work on Windows because killing a process in the task manager is unconditional, i.e., there's no way for an application to detect or prevent it.
Here's some relevant documentation from [`libuv`](https://github.com/libuv/libuv) to learn more about what `SIGINT`, `SIGBREAK` etc. signify and what's supported on Windows - http://docs.libuv.org/en/v1.x/signal.html.
Also see https://nodejs.org/api/process.html#process_signal_events.
