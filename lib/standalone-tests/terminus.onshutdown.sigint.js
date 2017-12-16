'use strict';
const http = require('http');
const server = http.createServer((req, res) => res.end('hello'));

const terminus = require('../terminus');

terminus(server, {
  useSigint: true,
  onKillSignal: () => {
    console.log('on-sigint-runs');
    return Promise.resolve();
  },
  onShutdown: () => {
    console.log('on-shutdown-runs');
  }
});

server.listen(8000, () => {
  process.kill(process.pid, 'SIGINT');
});
