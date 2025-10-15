const jwt = require('jsonwebtoken');
const config = require('../../config');
const stateStore = require('../../utils/state-store');
const logger = require('../../utils/logger');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and checks revocation list
 */
async function authMiddleware(req, res, next) {
  try {
    // Extract token from header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        code: 'AUTH_401',
        message: 'No token provided',
        correlationId: req.id,
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Check revocation list (Redis)
    const isRevoked = await stateStore.isJtiRevoked(decoded.jti);
    if (isRevoked) {
      return res.status(401).json({
        code: 'AUTH_401',
        message: 'Token revoked',
        correlationId: req.id,
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      jti: decoded.jti,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'AUTH_401',
        message: 'Token expired',
        correlationId: req.id,
      });
    }

    logger.error('Auth middleware error', { error: err.message });
    return res.status(401).json({
      code: 'AUTH_401',
      message: 'Invalid token',
      correlationId: req.id,
    });
  }
}

module.exports = { authMiddleware };
