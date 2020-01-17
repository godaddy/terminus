import * as http from "http";
import { createTerminus, HealthCheckError, HealthCheck, TerminusOptions } from "@godaddy/terminus";

async function onSignal() {
  console.log('server is starting cleanup');
  return Promise.all([
    // your clean logic, like closing database connections
  ]);
}

async function onShutdown() {
  console.log('cleanup finished, server is shutting down');
  return Promise.resolve();
}

const server = http.createServer((request, response) => {
  response.end('<html><body><h1>Hello, World!</h1></body></html>');
})

const healthcheck: HealthCheck = () => {
  const status = [{ status: 'up' }];
  const error = new HealthCheckError('Error', status);
  throw error;
}

const options: TerminusOptions = {
  healthChecks: {
    "/healthcheck": healthcheck,
    verbatim: true
  },
  timeout: 1000,
  onSignal,
  onShutdown,
  logger: console.log
};

createTerminus(server, options);

server.listen(3000);
