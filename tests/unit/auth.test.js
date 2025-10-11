const authManager = require('../../utils/auth');

describe('auth manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createSession generates token', () => {
    const token = authManager.createSession();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('validateSession accepts valid token', () => {
    const token = authManager.createSession();
    const session = authManager.validateSession(token);
    expect(session).toBeTruthy();
    expect(session.expires).toBeGreaterThan(Date.now());
  });

  test('validateSession rejects invalid token', () => {
    const session = authManager.validateSession('invalid-token');
    expect(session).toBeNull();
  });

  test('validateSession rejects expired token', () => {
    const token = authManager.createSession();
    const session = authManager.validateSession(token);
    jest.spyOn(Date, 'now').mockReturnValue(session.expires + 1000);
    const result = authManager.validateSession(token);
    expect(result).toBeNull();
  });

  test('cleanupExpiredSessions removes old sessions', () => {
    const token = authManager.createSession();
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 13 * 60 * 60 * 1000);
    authManager.cleanupExpiredSessions();
    const session = authManager.validateSession(token);
    expect(session).toBeNull();
  });
});
