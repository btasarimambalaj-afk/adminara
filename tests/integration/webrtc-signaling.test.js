const io = require('socket.io-client');
const http = require('http');
const ioServer = require('socket.io');
const socketHandlers = require('../../socket/handlers');

describe('WebRTC Signaling Integration', () => {
  let httpServer, ioServerInstance, clientSocket, adminSocket;
  const PORT = 3001;

  beforeAll((done) => {
    httpServer = http.createServer();
    ioServerInstance = ioServer(httpServer);
    
    const state = {
      adminSocket: null,
      customerSockets: new Map(),
      channelStatus: 'AVAILABLE',
      connectionCount: 0,
      otpStore: new Map(),
      bot: null
    };

    ioServerInstance.on('connection', (socket) => {
      socketHandlers(ioServerInstance, socket, state);
    });

    httpServer.listen(PORT, done);
  });

  afterAll((done) => {
    ioServerInstance.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    clientSocket = io(`http://localhost:${PORT}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) clientSocket.disconnect();
    if (adminSocket && adminSocket.connected) adminSocket.disconnect();
  });

  test('should exchange WebRTC offer', (done) => {
    const offer = { type: 'offer', sdp: 'v=0\r\no=- 123 456 IN IP4 127.0.0.1' };
    
    adminSocket = io(`http://localhost:${PORT}`);
    adminSocket.on('connect', () => {
      adminSocket.emit('room:join', { isAdmin: true });
      clientSocket.emit('room:join', { isAdmin: false, customerName: 'Test' });
      
      setTimeout(() => {
        adminSocket.once('rtc:description', (data) => {
          expect(data.description).toEqual(offer);
          done();
        });
        
        clientSocket.emit('rtc:description', { description: offer });
      }, 100);
    });
  });

  test('should exchange WebRTC answer', (done) => {
    const answer = { type: 'answer', sdp: 'v=0\r\no=- 789 012 IN IP4 127.0.0.1' };
    
    adminSocket = io(`http://localhost:${PORT}`);
    adminSocket.on('connect', () => {
      adminSocket.emit('room:join', { isAdmin: true });
      clientSocket.emit('room:join', { isAdmin: false, customerName: 'Test' });
      
      setTimeout(() => {
        clientSocket.once('rtc:description', (data) => {
          expect(data.description).toEqual(answer);
          done();
        });
        
        adminSocket.emit('rtc:description', { description: answer });
      }, 100);
    });
  });

  test('should exchange ICE candidates', (done) => {
    const candidate = {
      candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0
    };
    
    adminSocket = io(`http://localhost:${PORT}`);
    adminSocket.on('connect', () => {
      adminSocket.emit('room:join', { isAdmin: true });
      clientSocket.emit('room:join', { isAdmin: false, customerName: 'Test' });
      
      setTimeout(() => {
        adminSocket.once('rtc:ice:candidate', (data) => {
          expect(data.candidate).toEqual(candidate);
          done();
        });
        
        clientSocket.emit('rtc:ice:candidate', { candidate });
      }, 100);
    });
  });

  test('should handle call end', (done) => {
    adminSocket = io(`http://localhost:${PORT}`);
    adminSocket.on('connect', () => {
      adminSocket.emit('room:join', { isAdmin: true });
      clientSocket.emit('room:join', { isAdmin: false, customerName: 'Test' });
      
      setTimeout(() => {
        adminSocket.once('call:ended', () => {
          done();
        });
        
        clientSocket.emit('call:end');
      }, 100);
    });
  });
});
