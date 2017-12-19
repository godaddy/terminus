'use strict';
const stoppable = require('stoppable');
const promisify = require('es6-promisify');

const SUCCESS_RESPONSE = JSON.stringify({
  status: 'ok'
});

const FAILURE_RESPONSE = JSON.stringify({
  status: 'error'
});

function noopResolves() {
  return Promise.resolve();
}

function noop() {}

function decorateWithHealthCheck(server, options) {
  const { healthChecks, logger } = options;

  server.listeners('request').forEach((listener) => {
    server.removeListener('request', listener);
    server.on('request', (req, res) => {
      if (healthChecks[req.url]) {
        healthChecks[req.url]()
          .then(() => {
            res.statusCode = 200;
            res.end(SUCCESS_RESPONSE);
          })
          .catch((error) => {
            logger('healthcheck failed', error);
            res.statusCode = 503;
            res.end(FAILURE_RESPONSE);
          });
      } else {
        listener(req, res);
      }
    });
  });
}

function decorateWithSignalHandler(server, options) {
  const { signal, onSignal, onShutdown, timeout, logger } = options;

  stoppable(server, timeout);

  const asyncServerStop = promisify(server.stop).bind(server);

  function cleanup() {
    asyncServerStop()
      .then(() => onSignal())
      .then(() => onShutdown())
      .then(() => {
        process.removeListener(signal, cleanup);
        process.kill(process.pid, signal);
      })
      .catch((error) => {
        logger('error happened during shutdown', error);
        process.exit(1);
      });
  }
  process.on(signal, cleanup);
}

function terminus(server, options = {}) {
  const healthChecks = options.healthChecks || {};

  const signal = options.signal || 'SIGTERM';
  const timeout = options.timeout || 1000;
  const onSignal = options.onSignal || options.onSigterm || noopResolves;
  const onShutdown = options.onShutdown || noopResolves;

  const logger = options.logger || noop;

  decorateWithHealthCheck(server, {
    healthChecks,
    logger
  });

  decorateWithSignalHandler(server, {
    signal,
    onSignal,
    onShutdown,
    timeout,
    logger
  });

  return server;
}

module.exports = terminus;
