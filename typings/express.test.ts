import * as http from "http";
import { Terminus } from "@godaddy/terminus";
import * as express from "express";

const app = express();

app.get("/", (req, res) => res.send("ok"));

const server = http.createServer(app);

function onHealthCheck() {
  return Promise.resolve();
}

const terminus = new Terminus(http.createServer(app), {
  logger: console.log,
  healthChecks: {
    "/healthcheck": () => Promise.resolve()
  }
})


terminus.server.listen(3000);

async () => {
  const status = await terminus.getHealthStatus('/healthcheck');
  status.error
  status.status;
};
