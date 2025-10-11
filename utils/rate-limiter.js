const logger = require('./logger');

class RateLimiter {
  constructor() {
    this.requests = new Map(); // key -> { count, resetAt }
    this.locks = new Map();    // key -> { lockedUntil, reason }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  // Check if key is rate limited
  isLimited(key, limit, windowMs) {
    const now = Date.now();
    
    // Check if locked
    const lock = this.locks.get(key);
    if (lock && lock.lockedUntil > now) {
      return { limited: true, retryAfter: Math.ceil((lock.lockedUntil - now) / 1000), reason: lock.reason };
    }
    
    // Remove expired lock
    if (lock && lock.lockedUntil <= now) {
      this.locks.delete(key);
    }
    
    // Check rate limit
    const record = this.requests.get(key);
    if (!record || record.resetAt <= now) {
      // New window
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return { limited: false };
    }
    
    if (record.count >= limit) {
      return { limited: true, retryAfter: Math.ceil((record.resetAt - now) / 1000), reason: 'rate_limit' };
    }
    
    record.count++;
    return { limited: false };
  }

  // Increment counter
  increment(key, windowMs) {
    const now = Date.now();
    const record = this.requests.get(key);
    
    if (!record || record.resetAt <= now) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      record.count++;
    }
  }

  // Add lockout
  lockout(key, durationMs, reason = 'failed_attempts') {
    const lockedUntil = Date.now() + durationMs;
    this.locks.set(key, { lockedUntil, reason });
    logger.warn('Rate limiter lockout', { key: this.maskKey(key), reason, durationMs });
  }

  // Check if locked
  isLocked(key) {
    const lock = this.locks.get(key);
    if (!lock) return false;
    
    const now = Date.now();
    if (lock.lockedUntil <= now) {
      this.locks.delete(key);
      return false;
    }
    
    return true;
  }

  // Get lock info
  getLockInfo(key) {
    const lock = this.locks.get(key);
    if (!lock) return null;
    
    const now = Date.now();
    if (lock.lockedUntil <= now) {
      this.locks.delete(key);
      return null;
    }
    
    return {
      retryAfter: Math.ceil((lock.lockedUntil - now) / 1000),
      reason: lock.reason
    };
  }

  // Get active locks count
  getActiveLocks() {
    const now = Date.now();
    let count = 0;
    
    for (const [key, lock] of this.locks.entries()) {
      if (lock.lockedUntil > now) {
        count++;
      } else {
        this.locks.delete(key);
      }
    }
    
    return count;
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    
    // Cleanup requests
    for (const [key, record] of this.requests.entries()) {
      if (record.resetAt <= now) {
        this.requests.delete(key);
      }
    }
    
    // Cleanup locks
    for (const [key, lock] of this.locks.entries()) {
      if (lock.lockedUntil <= now) {
        this.locks.delete(key);
      }
    }
  }

  // Mask sensitive key data (for logging)
  maskKey(key) {
    if (!key) return 'unknown';
    if (key.length <= 8) return key.substring(0, 4) + '****';
    return key.substring(0, 8) + '****';
  }

  // Destroy (cleanup interval)
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = new RateLimiter();
