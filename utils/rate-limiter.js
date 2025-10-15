const logger = require('./logger');
const store = require('./state-store');

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.locks = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async isLimited(key, limit, windowMs) {
    const now = Date.now();

    if (process.env.REDIS_URL) {
      const lockKey = `lock:${key}`;
      const lockReason = await store.get(lockKey);
      if (lockReason) {
        const ttl = await store.ttl(lockKey);
        return { limited: true, retryAfter: Math.ceil(ttl / 1000), reason: lockReason };
      }

      const counterKey = `rate:${key}`;
      const current = await store.incrWithExpiry(counterKey, windowMs);
      if (current > limit) {
        const ttl = await store.ttl(counterKey);
        return { limited: true, retryAfter: Math.ceil(ttl / 1000), reason: 'rate_limit' };
      }
      return { limited: false };
    }

    const lock = this.locks.get(key);
    if (lock && lock.lockedUntil > now) {
      return {
        limited: true,
        retryAfter: Math.ceil((lock.lockedUntil - now) / 1000),
        reason: lock.reason,
      };
    }

    if (lock && lock.lockedUntil <= now) {
      this.locks.delete(key);
    }

    const record = this.requests.get(key);
    if (!record || record.resetAt <= now) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return { limited: false };
    }

    if (record.count >= limit) {
      return {
        limited: true,
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
        reason: 'rate_limit',
      };
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

  async lockout(key, durationMs, reason = 'failed_attempts') {
    if (process.env.REDIS_URL) {
      await store.setWithExpiry(`lock:${key}`, reason, durationMs);
    } else {
      const lockedUntil = Date.now() + durationMs;
      this.locks.set(key, { lockedUntil, reason });
    }
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
      reason: lock.reason,
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
