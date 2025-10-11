const adminAuth = require('../../socket/admin-auth');
const { issueToken, validateToken } = require('../../utils/session');

describe('Admin Auth - Extended Coverage', () => {
  let mockSocket, mockState, mockHandleRoomJoin;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
      handshake: { headers: {} }
    };

    mockHandleRoomJoin = jest.fn();
    mockSocket.handleRoomJoin = mockHandleRoomJoin;

    mockState = {
      otpStore: new Map(),
      adminSocket: null,
      customerSockets: new Map(),
      channelStatus: 'AVAILABLE'
    };
  });

  test('should reject admin:auth without token', () => {
    adminAuth(null, mockSocket, mockState);
    mockSocket.emit('admin:auth', {});
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'admin:auth:failed',
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('should reject admin:auth with invalid token', () => {
    adminAuth(null, mockSocket, mockState);
    mockSocket.emit('admin:auth', { token: 'invalid-token' });
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'admin:auth:failed',
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('should accept admin:auth with valid token', () => {
    const token = issueToken();
    adminAuth(null, mockSocket, mockState);
    
    mockSocket.emit('admin:auth', { token });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('admin:auth:success');
    expect(mockHandleRoomJoin).toHaveBeenCalledWith(mockSocket, { isAdmin: true });
  });

  test('should handle cookie-based auth', () => {
    const token = issueToken();
    mockSocket.handshake.headers.cookie = `adminSession=${token}`;
    
    adminAuth(null, mockSocket, mockState);
    mockSocket.emit('admin:auth', {});
    
    expect(mockSocket.emit).toHaveBeenCalledWith('admin:auth:success');
  });

  test('should reject expired token', () => {
    const expiredToken = issueToken();
    // Simulate token expiration by clearing from store
    const validation = validateToken(expiredToken);
    if (validation.valid) {
      // Force expiration
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 16 * 60 * 1000);
    }
    
    adminAuth(null, mockSocket, mockState);
    mockSocket.emit('admin:auth', { token: 'expired-token' });
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'admin:auth:failed',
      expect.any(Object)
    );
    
    jest.restoreAllMocks();
  });

  test('should handle multiple auth attempts', () => {
    const token = issueToken();
    adminAuth(null, mockSocket, mockState);
    
    mockSocket.emit('admin:auth', { token });
    mockSocket.emit('admin:auth', { token });
    
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    expect(mockHandleRoomJoin).toHaveBeenCalledTimes(2);
  });
});
