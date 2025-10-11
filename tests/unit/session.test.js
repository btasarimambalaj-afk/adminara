const { issueToken, validateToken, revokeToken, readSession } = require('../../utils/session');

describe('session management', () => {
  test('issueToken creates valid token', () => {
    const token = issueToken('admin');
    expect(token).toHaveLength(64);
    expect(validateToken(token)).toBe(true);
  });

  test('validateToken rejects invalid token', () => {
    expect(validateToken('invalid')).toBe(false);
  });

  test('validateToken rejects expired token', () => {
    const token = issueToken('admin', 100);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);
    expect(validateToken(token)).toBe(false);
  });

  test('readSession returns admin data', () => {
    const token = issueToken('admin');
    const session = readSession(token);
    expect(session.adminId).toBe('admin');
    expect(session.exp).toBeGreaterThan(Date.now());
  });

  test('revokeToken invalidates token', () => {
    const token = issueToken('admin');
    revokeToken(token);
    expect(validateToken(token)).toBe(false);
  });
});
