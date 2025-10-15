// tests/integration/socket-deep.test.js - Socket.IO Deep Tests

const io = require('socket.io-client');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('Socket.IO Deep Tests', () => {
  let server, socket;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await stopServer(server);
  });

  afterEach(() => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  test('Connection persistence across network interruptions', async () => {
    socket = io('http://localhost:3000', { reconnection: true, reconnectionDelay: 100 });
    
    await new Promise(resolve => socket.on('connect', resolve));
    expect(socket.connected).toBe(true);

    // Simulate disconnect
    socket.io.engine.close();
    await new Promise(resolve => setTimeout(resolve, 200));

    // Should auto-reconnect
    await new Promise(resolve => socket.on('connect', resolve));
    expect(socket.connected).toBe(true);
  }, 10000);

  test('Event rate limiting', async () => {
    socket = io('http://localhost:3000');
    await new Promise(resolve => socket.on('connect', resolve));

    const responses = [];
    for (let i = 0; i < 100; i++) {
      socket.emit('test-event', { data: i }, (response) => {
        responses.push(response);
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Some requests should be rate limited
    const rateLimited = responses.filter(r => r && r.error && r.error.includes('rate limit'));
    expect(rateLimited.length).toBeGreaterThan(0);
  }, 15000);
});
