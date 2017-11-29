const express = require('express');
const http = require('http');
const terminus = require('../lib/terminus');
const app = express();

app.get('/', (req, res) => {
  setTimeout(() => {
    res.send('ok');
  }, 100000);
});

function onHealthCheck() {
  return Promise.resolve();
}

terminus(http.createServer(app), {
  logger: console.log,
  onHealthCheck
}).listen(3000);
