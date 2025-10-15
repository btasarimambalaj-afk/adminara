const { SocketError, handleSocketError } = require('../../utils/error-handler');

describe('Error Handler', () => {
  describe('SocketError', () => {
    test('should create error with code', () => {
      const error = new SocketError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('SocketError');
    });

    test('should include data object', () => {
      const data = { userId: '123' };
      const error = new SocketError('Test', 'CODE', data);
      expect(error.data).toEqual(data);
    });
  });

  describe('handleSocketError', () => {
    test('should emit error event', () => {
      const mockSocket = {
        id: 'test-socket',
        emit: jest.fn(),
      };

      const error = new SocketError('Test error', 'TEST_CODE');
      handleSocketError(mockSocket, error);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Test error',
        code: 'TEST_CODE',
      });
    });

    test('should handle error without code', () => {
      const mockSocket = {
        id: 'test-socket',
        emit: jest.fn(),
      };

      const error = new Error('Generic error');
      handleSocketError(mockSocket, error);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Generic error',
        code: 'UNKNOWN_ERROR',
      });
    });
  });
});
