const { promisify } = require('util');
const stoppable = require('stoppable');

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

function decorateWithSigtermHandler(server, options) {
  const { onSigterm, onShutdown, timeout, logger } = options;

  stoppable(server, timeout);

  const asyncServerStop = promisify(server.stop).bind(server);

  function cleanup() {
    asyncServerStop()
      .then(() => onSigterm())
      .then(() => onShutdown())
      .then(() => {
        process.exit();
      })
      .catch((error) => {
        logger('error happened during shutdown', error);
        process.exit(1);
      });
  }
  process.on('SIGTERM', cleanup);
}

function terminus(server, options = {}) {
  const healthChecks = options.healthChecks || {};

  const timeout = options.timeout || 1000;
  const onSigterm = options.onSigterm || noopResolves;
  const onShutdown = options.onShutdown || noopResolves;

  const logger = options.logger || noop;

  decorateWithHealthCheck(server, {
    healthChecks,
    logger
  });

  decorateWithSigtermHandler(server, {
    onSigterm,
    onShutdown,
    timeout,
    logger
  });

  return server;
}

module.exports = terminus;
