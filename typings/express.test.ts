import * as http from "http";
import * as terminus from "@godaddy/terminus";
import * as express from "express";

const app = express();

app.get("/", (req, res) => res.send("ok"));

const server = http.createServer(app);
  
function onHealthCheck() {
  return Promise.resolve();
}

terminus.createTerminus(http.createServer(app), {
  logger: console.log,
  healthChecks: {
    "/healthcheck": () => Promise.resolve()
  }
}).listen(3000);
