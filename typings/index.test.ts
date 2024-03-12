import * as http from "http";
import { createTerminus, HealthCheckError, HealthCheck, TerminusOptions } from "@godaddy/terminus";

async function onSignal() {
  console.log('server is starting cleanup');
  return Promise.all([
    // your clean logic, like closing database connections
  ]);
}

async function onShutdownAsync() {
  console.log('cleanup finished, server is shutting down');
  return true;
}

const onShutdown: TerminusOptions["onShutdown"] = () => {
  console.log('cleanup finished, server is shutting down');
}

const server = http.createServer((request, response) => {
  response.end('<html><body><h1>Hello, World!</h1></body></html>');
})

const healthcheck: HealthCheck = () => {
  const status = [{ status: 'up' }];
  const error = new HealthCheckError('Error', status);
  throw error;
}

const healthcheckAsync: HealthCheck = async () => {
  const result = await Promise.resolve([{ status: 'up' }]);
  return result;
}

const healthcheckSync: HealthCheck = () => {
  return [{ status: 'up' }];
}

const options: TerminusOptions = {
  healthChecks: {
    "/healthcheck": healthcheck,
    "/healthcheck-sync": healthcheckSync,
    "/healthcheck-async": healthcheckAsync,
    verbatim: true
  },
  timeout: 1000,
  onSignal,
  onShutdown: onShutdownAsync,
  logger: console.log
};

createTerminus(server, options);

server.listen(3000);
