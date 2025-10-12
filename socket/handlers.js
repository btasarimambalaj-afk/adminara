const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const { SocketError, handleSocketError } = require('../utils/error-handler');
const { withTimeoutClear } = require('../utils/middleware');

// Validation helpers
function validateOffer(offer) {
  return offer && offer.type === 'offer' && typeof offer.sdp === 'string' && offer.sdp.length > 0;
}

function validateAnswer(answer) {
  return answer && answer.type === 'answer' && typeof answer.sdp === 'string' && answer.sdp.length > 0;
}

function validateIceCandidate(candidate) {
  return candidate && typeof candidate.candidate === 'string' && candidate.candidate.length > 0;
}

const ROOM_TIMEOUT_MS = 60000; // 1 dakika
let roomTimeout = null;

function clearRoomTimeout() {
  if (roomTimeout) {
    clearTimeout(roomTimeout);
    roomTimeout = null;
  }
}

// Middleware wrapper for timeout clearing
const withClearTimeout = withTimeoutClear(clearRoomTimeout);

const startRoomTimeout = withClearTimeout((state, io) => {
  roomTimeout = setTimeout(() => {
    logger.info('Room timeout - closing channel');
    
    // Bildirim gönder
    if (state.adminSocket) {
      state.adminSocket.emit('room:timeout', { message: 'Kanal zaman aşımı' });
    }
    state.customerSockets.forEach((cs) => {
      cs.emit('room:timeout', { message: 'Kanal zaman aşımı' });
    });
    
    // Temizle
    state.channelStatus = 'AVAILABLE';
    state.adminSocket = null;
    state.customerSockets.clear();
  }, ROOM_TIMEOUT_MS);
});

function createHandleRoomJoin(io, state) {
  const handleRoomJoin = function(socket, data) {
    const { customerSockets, bot } = state;
    try {
      const { isAdmin, customerName } = data;
      
      if (isAdmin) {
        // Admin session kontrolü
        if (state.adminSocket && state.adminSocket.id !== socket.id) {
          socket.emit('admin:session:active', { message: 'Başka bir oturum aktif' });
          logger.warn('Admin login rejected - active session exists');
          return;
        }
        
        state.adminSocket = socket;
        state.channelStatus = 'READY';
        socket.join('support-room');
        socket.emit('room:joined', { role: 'admin' });
        socket.emit('channel:joined', { role: 'admin' });
        logger.info('Admin joined room permanently - waiting for customers', { socketId: socket.id });
        
        // Bekleyen müşterilere admin hazır bildir
        customerSockets.forEach((cs, customerId) => {
          cs.emit('room:user:joined', { role: 'admin' });
          
          // Admin'e müşteri bilgisini gönder
          socket.emit('room:user:joined', { 
            role: 'customer', 
            userId: customerId,
            customerName: cs.customerName || 'Misafir'
          });
        });
      } else {
        if (customerSockets.size >= 1) {
          socket.emit('room:full', { message: 'Hat meşgul' });
          socket.emit('channel:busy', { message: 'Hat meşgul' });
          return;
        }
        
        const name = customerName || 'Misafir';
        socket.customerName = name;
        customerSockets.set(socket.id, socket);
        state.channelStatus = 'BUSY';
        socket.join('support-room');
        socket.emit('room:joined', { role: 'customer' });
        socket.emit('channel:joined', { role: 'customer' });
        
        if (state.adminSocket) {
          // Admin kanalda hazır bekliyor, direkt bağlan
          logger.info('Customer connected to waiting admin', { customerName: name });
          
          state.adminSocket.emit('room:user:joined', { 
            role: 'customer', 
            userId: socket.id, 
            customerName: name
          });
          
          socket.emit('room:user:joined', { role: 'admin' });
        } else {
          // Admin yok, 1 dakika bekle
          logger.info('Customer waiting for admin - 1 minute timeout');
          startRoomTimeout(state, io);
        }
        
        if (bot && process.env.TELEGRAM_ADMIN_CHAT_ID) {
          const adminUrl = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/admin.html` : `http://localhost:${process.env.PORT || 3000}/admin.html`;
          bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, 
            `🔔 Yeni müşteri aramaya hazır!\n\n👤 Müşteri: ${name}\n⏰ Saat: ${new Date().toLocaleTimeString('tr-TR')}\n\n👨💼 Admin Paneli:\n${adminUrl}`);
        }
        
        logger.info('Customer joined', { socketId: socket.id, customerName: name });
      }
    } catch (error) {
      handleSocketError(socket, new SocketError(
        error.message || 'Room join failed',
        'ROOM_JOIN_ERROR',
        { isAdmin, customerName }
      ));
    }
  };
  
  // Wrap with timeout clear middleware
  return withClearTimeout(handleRoomJoin);
}

module.exports = (io, socket, state) => {
  const { customerSockets, otpStore, bot } = state;
  const handleRoomJoin = createHandleRoomJoin(io, state);

  socket.on('visit', () => logger.info('Visitor', { socketId: socket.id }));
  socket.on('channel:join', (data) => handleRoomJoin(socket, data));
  socket.on('room:join', (data) => handleRoomJoin(socket, data));
  
  socket.on('customer:update:name', (data) => {
    const { customerName } = data;
    if (customerSockets.has(socket.id)) {
      socket.customerName = customerName;
      logger.info('Customer name updated', { socketId: socket.id, name: customerName });
      
      if (state.adminSocket) {
        state.adminSocket.emit('customer:name:updated', { 
          userId: socket.id, 
          customerName 
        });
      }
    }
  });
  
  // Export handleRoomJoin for admin-auth
  socket.handleRoomJoin = handleRoomJoin;

  // Perfect Negotiation Pattern - rtc:description (offer/answer)
  socket.on('rtc:description', (data) => {
    logger.info('Description', { from: socket.id, type: data.description?.type });
    socket.to('support-room').emit('rtc:description', data);
    metrics.webrtcEvents.inc({ event_type: data.description?.type || 'description' });
  });

  socket.on('rtc:ice:candidate', (data) => socket.to('support-room').emit('rtc:ice:candidate', data));

  socket.on('call:end', withClearTimeout(() => {
    socket.to('support-room').emit('call:ended');
    customerSockets.clear();
    logger.info('Call ended - starting timeout');
    startRoomTimeout(state, io);
  }));

  socket.on('disconnect', withClearTimeout(() => {
    state.connectionCount = Math.max(0, state.connectionCount - 1);
    logger.info('Disconnected', { socketId: socket.id, remaining: state.connectionCount });
    
    if (state.adminSocket?.id === socket.id) {
      logger.info('Admin disconnected - channel still available for reconnect');
      state.adminSocket = null;
      startRoomTimeout(state, io);
    }
    
    if (customerSockets.has(socket.id)) {
      logger.info('Customer disconnected', { socketId: socket.id });
      customerSockets.delete(socket.id);
      socket.to('support-room').emit('user:disconnected', { userId: socket.id });
      
      if (customerSockets.size === 0) {
        state.channelStatus = state.adminSocket ? 'READY' : 'AVAILABLE';
        logger.info('No customers remaining', { status: state.channelStatus });
      }
    }
    
    otpStore.delete(socket.id);
  }));
};

module.exports.validateOffer = validateOffer;
module.exports.validateAnswer = validateAnswer;
module.exports.validateIceCandidate = validateIceCandidate;
