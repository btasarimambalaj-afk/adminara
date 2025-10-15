// tests/helpers/server-helper.js - Test Server Helper
const http = require('http');
const app = require('../../server');

let server;

async function startServer(port = 0) {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(port, () => {
      resolve({ server, app, port: server.address().port });
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

module.exports = { startServer, stopServer };
