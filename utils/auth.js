const crypto = require('crypto');

class AuthManager {
  constructor() {
    this.adminSessions = new Map();
    this.sessionTimeout = 12 * 60 * 60 * 1000; // 12 hours
  }

  createSession() {
    const token = crypto.randomBytes(32).toString('hex');
    const session = {
      token,
      createdAt: Date.now(),
      expires: Date.now() + this.sessionTimeout,
      lastUsed: Date.now()
    };
    this.adminSessions.set(token, session);
    console.log('✅ Session created:', token.substring(0, 8) + '...', 'expires in 12h');
    return token;
  }

  validateSession(token) {
    const session = this.adminSessions.get(token);
    if (!session || session.expires < Date.now()) {
      if (session) {
        this.adminSessions.delete(token);
        console.log('❌ Session expired and removed:', token.substring(0, 8) + '...');
      }
      return null;
    }
    // Update last used time
    session.lastUsed = Date.now();
    console.log('✅ Session validated:', token.substring(0, 8) + '...', 'remaining:', Math.floor((session.expires - Date.now()) / 1000 / 60), 'min');
    return session;
  }

  removeSession(token) {
    this.adminSessions.delete(token);
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.adminSessions.entries()) {
      if (session.expires < now) {
        this.adminSessions.delete(sessionId);
      }
    }
  }
}

module.exports = new AuthManager();