import * as http from "http";
import { Terminus } from "@godaddy/terminus";
import * as Koa from "koa";

const app = new Koa();

const server = http.createServer(app.callback());

function onHealthCheck() {
  return Promise.resolve();
}

new Terminus(server, {
  logger: console.log,
  healthChecks: {
    "/healthcheck": () => Promise.resolve()
  }
});

server.listen(3000);
