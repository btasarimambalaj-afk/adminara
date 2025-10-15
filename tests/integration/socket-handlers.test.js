const io = require('socket.io-client');
const http = require('http');
const socketIO = require('socket.io');

describe('Socket Handlers Integration', () => {
  let server, ioServer, clientSocket;

  beforeAll(done => {
    server = http.createServer();
    ioServer = socketIO(server);

    const mockState = {
      adminSocket: null,
      customerSockets: new Map(),
      channelStatus: 'AVAILABLE',
      otpStore: new Map(),
      bot: null,
    };

    ioServer.on('connection', socket => {
      require('../../socket/handlers')(ioServer, socket, mockState);
    });

    server.listen(() => {
      const port = server.address().port;
      clientSocket = io(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    ioServer.close();
    clientSocket.close();
    server.close();
  });

  test('should handle room:join event', done => {
    clientSocket.emit('room:join', {
      role: 'customer',
      customerName: 'Test User',
    });

    clientSocket.on('room:joined', data => {
      expect(data.role).toBe('customer');
      done();
    });
  });

  test('should handle rtc:description event', done => {
    clientSocket.emit('rtc:description', {
      type: 'description',
      description: { type: 'offer', sdp: 'test-sdp' },
    });

    setTimeout(done, 100);
  });

  test('should handle rtc:ice-candidate event', done => {
    clientSocket.emit('rtc:ice-candidate', {
      type: 'ice-candidate',
      candidate: { candidate: 'test-candidate' },
    });

    setTimeout(done, 100);
  });
});
