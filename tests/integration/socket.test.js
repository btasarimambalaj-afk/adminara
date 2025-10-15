const io = require('socket.io-client');
const http = require('http');
const socketIO = require('socket.io');

describe('Socket Integration Tests', () => {
  let server, ioServer, clientSocket;
  const PORT = 3001;

  beforeAll(done => {
    server = http.createServer();
    ioServer = socketIO(server);

    // Mock handlers
    ioServer.on('connection', socket => {
      socket.on('room:join', data => {
        socket.join('support-room');
        socket.emit('room:joined', { role: data.isAdmin ? 'admin' : 'customer' });
      });

      socket.on('rtc:description', data => {
        socket.to('support-room').emit('rtc:description', data);
      });

      socket.on('rtc:ice:candidate', data => {
        socket.to('support-room').emit('rtc:ice:candidate', data);
      });
    });

    server.listen(PORT, done);
  });

  afterAll(done => {
    ioServer.close();
    server.close(done);
  });

  beforeEach(done => {
    clientSocket = io(`http://localhost:${PORT}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Room Management', () => {
    test('should join room as customer', done => {
      clientSocket.emit('room:join', { isAdmin: false, customerName: 'Test' });
      clientSocket.on('room:joined', data => {
        expect(data.role).toBe('customer');
        done();
      });
    });

    test('should join room as admin', done => {
      clientSocket.emit('room:join', { isAdmin: true });
      clientSocket.on('room:joined', data => {
        expect(data.role).toBe('admin');
        done();
      });
    });
  });

  describe('WebRTC Signaling', () => {
    test('should relay rtc:description', done => {
      const client2 = io(`http://localhost:${PORT}`);

      client2.on('connect', () => {
        clientSocket.emit('room:join', { isAdmin: false });
        client2.emit('room:join', { isAdmin: true });

        const description = { type: 'offer', sdp: 'test-sdp' };

        client2.on('rtc:description', data => {
          expect(data.description).toEqual(description);
          client2.disconnect();
          done();
        });

        clientSocket.emit('rtc:description', { description });
      });
    });

    test('should relay ICE candidates', done => {
      const client2 = io(`http://localhost:${PORT}`);

      client2.on('connect', () => {
        clientSocket.emit('room:join', { isAdmin: false });
        client2.emit('room:join', { isAdmin: true });

        const candidate = { candidate: 'test-candidate' };

        client2.on('rtc:ice:candidate', data => {
          expect(data.candidate).toBe('test-candidate');
          client2.disconnect();
          done();
        });

        clientSocket.emit('rtc:ice:candidate', candidate);
      });
    });
  });
});
