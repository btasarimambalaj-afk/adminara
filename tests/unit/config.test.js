const config = require('../../config');

describe('Config Validation', () => {
  test('should load all required env variables', () => {
    expect(config.PORT).toBeDefined();
    expect(config.SESSION_SECRET).toBeDefined();
    expect(config.COOKIE_SECRET).toBeDefined();
  });

  test('should have secure defaults in production', () => {
    if (config.isProduction) {
      expect(config.SESSION_SECRET).not.toBe('dev-session-secret');
      expect(config.COOKIE_SECRET).not.toBe('dev-cookie-secret');
      expect(config.JWT_SECRET).not.toBe('dev-jwt-secret-change-in-production');
    }
  });

  test('should validate TURN TTL is 300s or less', () => {
    expect(config.TURN_TTL).toBeLessThanOrEqual(300);
  });

  test('should validate JWT TTL values', () => {
    expect(config.JWT_ACCESS_TTL).toBeLessThanOrEqual(900); // 15 min max
    expect(config.JWT_REFRESH_TTL).toBeLessThanOrEqual(604800); // 7 days max
  });

  test('should validate bitrate ranges', () => {
    expect(config.MIN_BITRATE).toBeGreaterThanOrEqual(100000); // 100kbps min
    expect(config.MAX_BITRATE).toBeLessThanOrEqual(3000000); // 3Mbps max
    expect(config.MIN_BITRATE).toBeLessThan(config.MAX_BITRATE);
  });

  test('should validate battery threshold', () => {
    expect(config.BATTERY_THRESHOLD).toBeGreaterThan(0);
    expect(config.BATTERY_THRESHOLD).toBeLessThan(1);
  });
});
