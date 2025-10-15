// Timeout clear middleware
function withTimeoutClear(clearFn) {
  return function (handler) {
    return function (...args) {
      clearFn();
      return handler.apply(this, args);
    };
  };
}

// CSRF token generator
function generateCSRFToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// CSRF validation middleware
function validateCSRF(socket, next) {
  const token = socket.handshake.auth.csrfToken;
  const validToken = socket.handshake.session?.csrfToken;

  if (!token || token !== validToken) {
    return next(new Error('Invalid CSRF token'));
  }
  next();
}

module.exports = {
  withTimeoutClear,
  generateCSRFToken,
  validateCSRF,
};
