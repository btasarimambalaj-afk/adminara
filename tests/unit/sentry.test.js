const { initSentry, captureError, captureMessage } = require('../../utils/sentry');

describe('Sentry Utils', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {};
    delete process.env.SENTRY_DSN;
  });

  describe('initSentry', () => {
    it('should return false when DSN not configured', () => {
      const result = initSentry(mockApp);
      expect(result).toBe(false);
    });

    it('should return true when DSN configured', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      const result = initSentry(mockApp);
      expect(result).toBe(true);
    });
  });

  describe('captureError', () => {
    it('should not throw when DSN not configured', () => {
      expect(() => {
        captureError(new Error('Test error'));
      }).not.toThrow();
    });

    it('should accept context object', () => {
      expect(() => {
        captureError(new Error('Test'), { userId: '123' });
      }).not.toThrow();
    });
  });

  describe('captureMessage', () => {
    it('should not throw when DSN not configured', () => {
      expect(() => {
        captureMessage('Test message');
      }).not.toThrow();
    });

    it('should accept log level', () => {
      expect(() => {
        captureMessage('Test', 'warning');
      }).not.toThrow();
    });
  });
});
