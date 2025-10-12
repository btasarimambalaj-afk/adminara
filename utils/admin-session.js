const crypto = require('crypto');
const store = require('./state-store');
const logger = require('./logger');

const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '43200000', 10); // 12h

// In-memory fallback
const memoryStore = new Map();

async function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('hex');
  
  if (process.env.REDIS_URL) {
    await store.storeSession(token, adminId, SESSION_TTL_MS);
  } else {
    memoryStore.set(token, { adminId, expires: Date.now() + SESSION_TTL_MS });
  }
  
  logger.info('Session created', { adminId, tokenPrefix: token.substring(0, 8) });
  return token;
}

async function validateSession(token) {
  if (!token) return null;
  
  if (process.env.REDIS_URL) {
    return store.readSession(token);
  } else {
    const session = memoryStore.get(token);
    if (!session || session.expires < Date.now()) {
      memoryStore.delete(token);
      return null;
    }
    // Sliding expiration
    session.expires = Date.now() + SESSION_TTL_MS;
    return { adminId: session.adminId };
  }
}

async function revokeSession(token) {
  if (!token) return;
  
  if (process.env.REDIS_URL) {
    await store.deleteSession(token);
  } else {
    memoryStore.delete(token);
  }
  
  logger.info('Session revoked', { tokenPrefix: token.substring(0, 8) });
}

// Cleanup expired sessions (in-memory only)
function cleanupExpiredSessions() {
  if (process.env.REDIS_URL) return; // Redis handles TTL
  
  const now = Date.now();
  let cleaned = 0;
  
  for (const [token, session] of memoryStore.entries()) {
    if (session.expires < now) {
      memoryStore.delete(token);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info('Expired sessions cleaned', { count: cleaned });
  }
}

module.exports = {
  createSession,
  validateSession,
  revokeSession,
  cleanupExpiredSessions,
  SESSION_TTL_MS,
};
