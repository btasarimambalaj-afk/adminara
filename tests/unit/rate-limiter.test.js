const rateLimiter = require('../../utils/rate-limiter');

describe('rate-limiter', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  test('allows requests within limit', () => {
    const key = 'test-key';
    rateLimiter.increment(key, 60000);
    rateLimiter.increment(key, 60000);
    const result = rateLimiter.isLimited(key, 5, 60000);
    expect(result.limited).toBe(false);
  });

  test('blocks requests exceeding limit', () => {
    const key = 'test-key-2';
    for (let i = 0; i < 6; i++) {
      rateLimiter.increment(key, 60000);
    }
    const result = rateLimiter.isLimited(key, 5, 60000);
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test('resets after window expires', () => {
    const key = 'test-key-3';
    for (let i = 0; i < 6; i++) {
      rateLimiter.increment(key, 1000);
    }
    jest.advanceTimersByTime(1100);
    const result = rateLimiter.isLimited(key, 5, 1000);
    expect(result.limited).toBe(false);
  });
});
