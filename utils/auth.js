const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const stateStore = require('./state-store');
const logger = require('./logger');

/**
 * Generate JWT tokens (access + refresh)
 * @param {Object} user - User object { id, role }
 * @returns {Object} { accessToken, refreshToken, expiresIn }
 */
async function issueTokens(user) {
  const jti = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  
  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: user.role || 'viewer',
      jti,
      iat: now,
      nbf: now,
      exp: now + config.JWT_ACCESS_TTL
    },
    config.JWT_SECRET
  );
  
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
      jti: uuidv4(),
      iat: now,
      exp: now + config.JWT_REFRESH_TTL
    },
    config.JWT_SECRET
  );
  
  // Sync JWT to Redis for cross-instance sharing
  const bridge = require('./bridge');
  await bridge.syncJWT(accessToken, user.id, config.JWT_ACCESS_TTL);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: config.JWT_ACCESS_TTL
  };
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      clockTolerance: 30 // 30s clock skew tolerance
    });
  } catch (err) {
    logger.warn('JWT verification failed', { error: err.message });
    throw err;
  }
}

/**
 * Revoke JWT by JTI
 * @param {string} jti - JWT ID
 * @returns {Promise<void>}
 */
async function revokeJti(jti) {
  await stateStore.revokeJti(jti, config.JWT_ACCESS_TTL);
  logger.info('JWT revoked', { jti });
}

/**
 * Generate MFA secret for user
 * @param {string} userId - User ID
 * @returns {Object} { secret, qrCode }
 */
async function generateMfaSecret(userId) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(userId, config.MFA_ISSUER, secret);
  const qrCode = await QRCode.toDataURL(otpauth);
  
  return { secret, qrCode, otpauth };
}

/**
 * Verify TOTP code
 * @param {string} secret - User's MFA secret
 * @param {string} code - 6-digit TOTP code
 * @returns {boolean}
 */
function verifyTotp(secret, code) {
  try {
    return authenticator.verify({
      token: code,
      secret,
      window: 1 // ±30s window
    });
  } catch (err) {
    logger.warn('TOTP verification failed', { error: err.message });
    return false;
  }
}

/**
 * Generate backup codes for MFA
 * @param {number} count - Number of codes to generate
 * @returns {string[]}
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

module.exports = {
  issueTokens,
  verifyToken,
  revokeJti,
  generateMfaSecret,
  verifyTotp,
  generateBackupCodes
};
