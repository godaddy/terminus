'use strict';
const http = require('http');
const server = http.createServer((req, res) => res.end('hello'));

const terminus = require('../terminus');

terminus(server, {
  useSigint: true,
  onSigint: () => {
    console.log('on-sigint-runs');
    return Promise.resolve();
  }
});

server.listen(8000, () => {
  process.kill(process.pid, 'SIGINT');
});