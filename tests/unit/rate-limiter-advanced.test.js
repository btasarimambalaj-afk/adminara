const rateLimiter = require('../../utils/rate-limiter');

describe('Rate Limiter - Advanced Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    rateLimiter.attempts.clear();
    rateLimiter.locks.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Window Reset', () => {
    it('should reset counter after window expires', () => {
      const key = 'test-key';
      const windowMs = 60000; // 1 minute
      
      // Fill up to limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.increment(key, windowMs);
      }
      
      expect(rateLimiter.isLimited(key, 5, windowMs).limited).toBe(true);
      
      // Advance past window
      jest.advanceTimersByTime(61000);
      
      // Should be reset
      expect(rateLimiter.isLimited(key, 5, windowMs).limited).toBe(false);
    });

    it('should maintain count within window', () => {
      const key = 'test-key';
      const windowMs = 60000;
      
      rateLimiter.increment(key, windowMs);
      
      // Advance 30 seconds (within window)
      jest.advanceTimersByTime(30000);
      
      rateLimiter.increment(key, windowMs);
      
      const data = rateLimiter.attempts.get(key);
      expect(data.count).toBe(2);
    });
  });

  describe('Multi-IP Scenarios', () => {
    it('should track different IPs separately', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      const windowMs = 60000;
      
      // Max out IP1
      for (let i = 0; i < 5; i++) {
        rateLimiter.increment(ip1, windowMs);
      }
      
      // IP1 should be limited
      expect(rateLimiter.isLimited(ip1, 5, windowMs).limited).toBe(true);
      
      // IP2 should not be limited
      expect(rateLimiter.isLimited(ip2, 5, windowMs).limited).toBe(false);
    });

    it('should handle concurrent requests from same IP', () => {
      const ip = '192.168.1.1';
      const windowMs = 60000;
      
      // Simulate concurrent requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.increment(ip, windowMs);
      }
      
      const data = rateLimiter.attempts.get(ip);
      expect(data.count).toBe(10);
    });
  });

  describe('Cleanup Expired Entries', () => {
    it('should remove old entries', () => {
      const key1 = 'old-key';
      const key2 = 'new-key';
      
      rateLimiter.increment(key1, 60000);
      
      // Advance 2 minutes
      jest.advanceTimersByTime(120000);
      
      rateLimiter.increment(key2, 60000);
      
      // Cleanup
      rateLimiter.cleanup();
      
      expect(rateLimiter.attempts.has(key1)).toBe(false);
      expect(rateLimiter.attempts.has(key2)).toBe(true);
    });

    it('should cleanup expired locks', () => {
      const key = 'locked-key';
      
      rateLimiter.lockout(key, 60000, 'Test lockout');
      
      expect(rateLimiter.locks.has(key)).toBe(true);
      
      // Advance past lockout
      jest.advanceTimersByTime(61000);
      
      rateLimiter.cleanup();
      
      expect(rateLimiter.locks.has(key)).toBe(false);
    });
  });

  describe('Lockout Mechanism', () => {
    it('should lockout after max failures', () => {
      const key = 'bad-actor';
      const windowMs = 60000;
      
      // Exceed limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.increment(key, windowMs);
      }
      
      rateLimiter.lockout(key, 900000, 'Too many attempts');
      
      expect(rateLimiter.isLimited(key, 5, windowMs).limited).toBe(true);
    });

    it('should remain locked even after window reset', () => {
      const key = 'locked-key';
      
      rateLimiter.lockout(key, 900000, 'Permanent lock');
      
      // Advance past normal window
      jest.advanceTimersByTime(61000);
      
      // Should still be locked
      expect(rateLimiter.isLimited(key, 5, 60000).limited).toBe(true);
    });

    it('should unlock after lockout duration', () => {
      const key = 'temp-lock';
      
      rateLimiter.lockout(key, 60000, 'Temporary lock');
      
      expect(rateLimiter.isLimited(key, 5, 60000).limited).toBe(true);
      
      // Advance past lockout
      jest.advanceTimersByTime(61000);
      
      rateLimiter.cleanup();
      
      expect(rateLimiter.isLimited(key, 5, 60000).limited).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero limit', () => {
      const key = 'zero-limit';
      
      const result = rateLimiter.isLimited(key, 0, 60000);
      expect(result.limited).toBe(true);
    });

    it('should handle negative window', () => {
      const key = 'negative-window';
      
      rateLimiter.increment(key, -1000);
      
      // Should not crash
      expect(rateLimiter.attempts.has(key)).toBe(true);
    });

    it('should handle very large counts', () => {
      const key = 'large-count';
      
      for (let i = 0; i < 1000; i++) {
        rateLimiter.increment(key, 60000);
      }
      
      const data = rateLimiter.attempts.get(key);
      expect(data.count).toBe(1000);
    });
  });

  describe('Performance', () => {
    it('should handle many keys efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        rateLimiter.increment(`key-${i}`, 60000);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
