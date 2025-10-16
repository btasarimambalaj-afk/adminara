const crypto = require('crypto');

/**
 * Correlation ID Middleware
 * Generates X-Request-ID for request tracing
 */
function correlationMiddleware(req, res, next) {
  // Use existing X-Request-ID or generate new
  req.id = req.headers['x-request-id'] || crypto.randomUUID();

  // Set response header
  res.setHeader('X-Request-ID', req.id);

  // Attach to logger context
  req.log = require('../../utils/logger').child({ requestId: req.id });

  next();
}

module.exports = { correlationMiddleware };
