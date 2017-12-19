import * as http from "http";
import * as terminus from "@godaddy/terminus";

async function onSignal () {
  console.log('server is starting cleanup');
  return Promise.all([
    // your clean logic, like closing database connections
  ]);
}

async function onShutdown () {
  console.log('cleanup finished, server is shutting down');
  return Promise.resolve();
}

const server = http.createServer((request, response) => {
  response.end('<html><body><h1>Hello, World!</h1></body></html>');
})

terminus(server, {
  healthChecks: {
    "/healthcheck": () => Promise.resolve()
  },
  timeout: 1000,
  onSignal,
  onShutdown,
  logger: console.log
});

server.listen(3000);
