const { validateCSRF, generateCSRFToken } = require('../../utils/middleware');

describe('Security: CSRF Protection', () => {
  test('should generate valid CSRF token', () => {
    const token = generateCSRFToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  test('should reject missing CSRF token', done => {
    const socket = {
      handshake: {
        auth: {},
        session: { csrfToken: 'valid-token' },
      },
    };

    validateCSRF(socket, err => {
      expect(err).toBeDefined();
      expect(err.message).toContain('Invalid CSRF token');
      done();
    });
  });

  test('should reject invalid CSRF token', done => {
    const socket = {
      handshake: {
        auth: { csrfToken: 'invalid' },
        session: { csrfToken: 'valid-token' },
      },
    };

    validateCSRF(socket, err => {
      expect(err).toBeDefined();
      expect(err.message).toContain('Invalid CSRF token');
      done();
    });
  });

  test('should accept valid CSRF token', done => {
    const token = 'valid-token';
    const socket = {
      handshake: {
        auth: { csrfToken: token },
        session: { csrfToken: token },
      },
    };

    validateCSRF(socket, err => {
      expect(err).toBeUndefined();
      done();
    });
  });
});
