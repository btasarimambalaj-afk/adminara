const logger = require('./logger');

class SocketError extends Error {
  constructor(message, code, data = {}) {
    super(message);
    this.name = 'SocketError';
    this.code = code;
    this.data = data;
  }
}

function handleSocketError(socket, error) {
  const errorData = {
    socketId: socket.id,
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    data: error.data || {},
  };

  logger.error('Socket error', errorData);

  socket.emit('error', {
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
  });
}

module.exports = {
  SocketError,
  handleSocketError,
};
