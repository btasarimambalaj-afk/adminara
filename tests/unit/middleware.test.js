const { withTimeoutClear, generateCSRFToken, validateCSRF } = require('../../utils/middleware');

describe('Middleware', () => {
  describe('withTimeoutClear', () => {
    test('should call clear function before handler', () => {
      const clearFn = jest.fn();
      const handler = jest.fn();
      
      const wrapped = withTimeoutClear(clearFn)(handler);
      wrapped('arg1', 'arg2');

      expect(clearFn).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should call clear before each invocation', () => {
      const clearFn = jest.fn();
      const handler = jest.fn();
      
      const wrapped = withTimeoutClear(clearFn)(handler);
      wrapped();
      wrapped();

      expect(clearFn).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateCSRFToken', () => {
    test('should generate 64 char token', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64);
    });

    test('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateCSRF', () => {
    test('should call next with valid token', () => {
      const token = generateCSRFToken();
      const socket = {
        handshake: { auth: { csrfToken: token } },
        request: { session: { csrfToken: token } }
      };
      const next = jest.fn();

      validateCSRF(socket, next);
      expect(next).toHaveBeenCalledWith();
    });

    test('should call next with error for invalid token', () => {
      const socket = {
        handshake: { auth: { csrfToken: 'invalid' } },
        request: { session: { csrfToken: 'valid' } }
      };
      const next = jest.fn();

      validateCSRF(socket, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
