const logger = require('./logger');

/**
 * Socket.IO Event Rate Limiter
 * Prevents flood attacks on Socket.IO events
 */
class SocketRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxEvents = options.maxEvents || 100; // 100 events per minute
    this.clients = new Map();
  }
  
  /**
   * Check if client exceeded rate limit
   */
  check(socketId, eventName) {
    const now = Date.now();
    const key = `${socketId}:${eventName}`;
    
    if (!this.clients.has(key)) {
      this.clients.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    
    const client = this.clients.get(key);
    
    // Reset if window expired
    if (now > client.resetAt) {
      client.count = 1;
      client.resetAt = now + this.windowMs;
      return true;
    }
    
    // Increment count
    client.count++;
    
    // Check limit
    if (client.count > this.maxEvents) {
      logger.warn('Socket rate limit exceeded', { 
        socketId, 
        eventName, 
        count: client.count 
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, client] of this.clients.entries()) {
      if (now > client.resetAt) {
        this.clients.delete(key);
      }
    }
  }
}

// Singleton instance
const socketRateLimiter = new SocketRateLimiter({
  windowMs: 60000, // 1 minute
  maxEvents: 100 // 100 events per minute per event type
});

// Cleanup every 5 minutes
setInterval(() => socketRateLimiter.cleanup(), 5 * 60 * 1000);

module.exports = socketRateLimiter;
