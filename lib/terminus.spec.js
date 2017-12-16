'use strict';
const http = require('http');
const { execFileSync } = require('child_process');

const expect = require('chai').expect;
const fetch = require('node-fetch');

const terminus = require('./terminus');

describe('Terminus', () => {
  let server;

  beforeEach(() => {
    server = http.createServer((req, res) => res.end('hello'));
  });

  afterEach(() => {
    server.close();
  });

  describe('supports onHealthcheck for the healthcheck route', () => {
    it('but keeps all the other endpoints', (done) => {
      terminus(server, {});
      server.listen(8000);

      fetch('http://localhost:8000')
        .then(res => res.text())
        .then(responseText => {
          expect(responseText).to.eql('hello');
          done();
        })
        .catch(done);
    });

    it('returns 200 on resolve', (done) => {
      let onHealthCheckRan = false;

      terminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true;
            return Promise.resolve();
          }
        }
      });
      server.listen(8000);

      fetch('http://localhost:8000/health')
        .then(res => {
          expect(res.status).to.eql(200);
          expect(onHealthCheckRan).to.eql(true);
          done();
        })
        .catch(done);
    });

    it('returns 503 on reject', (done) => {
      let onHealthCheckRan = false;
      let loggerRan = false;

      terminus(server, {
        healthChecks: {
          '/health': () => {
            onHealthCheckRan = true;
            return Promise.reject(new Error('failed'));
          }
        },
        logger: () => {
          loggerRan = true;
        }
      });
      server.listen(8000);

      fetch('http://localhost:8000/health')
        .then(res => {
          expect(res.status).to.eql(503);
          expect(onHealthCheckRan).to.eql(true);
          expect(loggerRan).to.eql(true);
          done();
        })
        .catch(done);
    });
  });

  it('runs onSigterm when getting the SIGTERM signal', () => {
    try {
      execFileSync('node', ['lib/standalone-tests/terminus.onsigterm.js']);
    } catch (ex) {
      expect(ex.stdout.toString().trim()).to.eql('on-sigterm-runs');
      return;
    }

    throw new Error('running the test should throw, as the exitcode is not 0');
  });

  it('runs onShutdown after onSigterm', () => {
    try {
      execFileSync('node', ['lib/standalone-tests/terminus.onshutdown.sigterm.js']);
    } catch (ex) {
      expect(ex.stdout.toString().trim()).to.eql('on-sigterm-runs\non-shutdown-runs');
      return;
    }

    throw new Error('running the test should throw, as the exitcode is not 0');
  });

  it('runs onSigint when getting SIGINT signal', () => {
    try {
      execFileSync('node', ['lib/standalone-tests/terminus.onsigint.js']);
    } catch (ex) {
      expect(ex.stdout.toString().trim()).to.eql('on-sigint-runs');
      return;
    }

    throw new Error('running the test should throw, as the exitcode is not 0');
  });

  it('runs onShutdown after onSigint', () => {
    try {
      execFileSync('node', ['lib/standalone-tests/terminus.onshutdown.sigint.js']);
    } catch (ex) {
      expect(ex.stdout.toString().trim()).to.eql('on-sigint-runs\non-shutdown-runs');
      return;
    }

    throw new Error('running the test should throw, as the exitcode is not 0');
  });
});
