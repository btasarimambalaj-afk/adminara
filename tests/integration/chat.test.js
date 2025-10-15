const io = require('socket.io-client');
const http = require('http');
const socketIO = require('socket.io');

describe('Chat System Integration', () => {
  let server, ioServer, clientSocket, adminSocket;

  beforeAll(done => {
    server = http.createServer();
    ioServer = socketIO(server);
    server.listen(() => {
      const port = server.address().port;
      clientSocket = io(`http://localhost:${port}`);
      adminSocket = io(`http://localhost:${port}`);

      let connected = 0;
      const checkDone = () => {
        connected++;
        if (connected === 2) done();
      };

      clientSocket.on('connect', checkDone);
      adminSocket.on('connect', checkDone);
    });
  });

  afterAll(() => {
    clientSocket.close();
    adminSocket.close();
    ioServer.close();
    server.close();
  });

  test('should send chat message', done => {
    const message = 'Hello from customer';

    adminSocket.on('chat:message', data => {
      expect(data.message).toBe(message);
      expect(data.sender).toBe(clientSocket.id);
      expect(data.timestamp).toBeDefined();
      done();
    });

    clientSocket.emit('chat:send', { message });
  });

  test('should reject empty message', done => {
    adminSocket.on('chat:message', () => {
      done.fail('Should not receive empty message');
    });

    clientSocket.emit('chat:send', { message: '' });

    setTimeout(done, 100);
  });

  test('should reject long message (>500 chars)', done => {
    const longMessage = 'a'.repeat(501);

    adminSocket.on('chat:message', () => {
      done.fail('Should not receive long message');
    });

    clientSocket.emit('chat:send', { message: longMessage });

    setTimeout(done, 100);
  });
});
