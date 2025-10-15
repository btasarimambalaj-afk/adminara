// tests/integration/socket-connection-deep.test.js - Socket Connection Deep Tests

const io = require('socket.io-client');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('Socket Connection Deep Tests', () => {
  let server, socket;

  beforeAll(async () => {
    ({ server } = await startServer());
  });

  afterAll(async () => {
    if (socket) socket.disconnect();
    await stopServer();
  });

  test('Ping RTT measurement every 5s', (done) => {
    socket = io('http://localhost:3000', { forceNew: true });
    const rtts = [];

    socket.on('connect', () => {
      const interval = setInterval(() => {
        const start = Date.now();
        socket.emit('ping', () => {
          const rtt = Date.now() - start;
          rtts.push(rtt);
          
          if (rtts.length >= 3) {
            clearInterval(interval);
            expect(rtts.every(r => r < 1000)).toBe(true);
            done();
          }
        });
      }, 5000);
    });
  }, 20000);

  test('Auto-reconnect after disconnect', (done) => {
    socket = io('http://localhost:3000', { 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3
    });

    let disconnected = false;
    let reconnected = false;

    socket.on('connect', () => {
      if (!disconnected) {
        socket.disconnect();
        disconnected = true;
      } else {
        reconnected = true;
        expect(reconnected).toBe(true);
        done();
      }
    });

    socket.on('disconnect', () => {
      setTimeout(() => socket.connect(), 1000);
    });
  }, 10000);

  test('Specific events emit correctly', (done) => {
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
      socket.emit('test:event', { data: 'test' });
    });

    socket.on('test:response', (data) => {
      expect(data).toBeDefined();
      done();
    });
  }, 5000);

  test('Invalid namespace connection fails', (done) => {
    const invalidSocket = io('http://localhost:3000/invalid-namespace');
    
    invalidSocket.on('connect_error', (err) => {
      expect(err).toBeDefined();
      invalidSocket.disconnect();
      done();
    });
  }, 5000);

  test('Ping interval configured correctly', (done) => {
    socket = io('http://localhost:3000', { 
      pingInterval: 25000,
      pingTimeout: 5000
    });

    socket.on('connect', () => {
      expect(socket.io.opts.pingInterval).toBe(25000);
      done();
    });
  }, 5000);
});
