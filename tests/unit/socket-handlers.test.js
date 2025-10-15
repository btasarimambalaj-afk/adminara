const { createHandleRoomJoin } = require('../../socket/handlers');

describe('Socket Handlers', () => {
  let mockIo, mockSocket, mockState;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      emit: jest.fn(),
      handshake: { address: '127.0.0.1' },
    };

    mockState = {
      adminSocket: null,
      customerSockets: new Map(),
      channelStatus: 'AVAILABLE',
      bot: null,
    };
  });

  describe('createHandleRoomJoin', () => {
    it('should handle customer join', () => {
      const handler = createHandleRoomJoin(mockIo, mockSocket, mockState, 'support-room');

      handler({ role: 'customer', customerName: 'Test User' });

      expect(mockSocket.join).toHaveBeenCalledWith('support-room');
      expect(mockState.customerSockets.has('test-socket-id')).toBe(true);
    });

    it('should handle admin join', () => {
      const handler = createHandleRoomJoin(mockIo, mockSocket, mockState, 'support-room');

      handler({ role: 'admin' });

      expect(mockSocket.join).toHaveBeenCalledWith('support-room');
      expect(mockState.adminSocket).toBe(mockSocket);
    });

    it('should reject invalid role', () => {
      const handler = createHandleRoomJoin(mockIo, mockSocket, mockState, 'support-room');

      handler({ role: 'invalid' });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: expect.stringContaining('Invalid role'),
        })
      );
    });

    it('should handle missing customerName', () => {
      const handler = createHandleRoomJoin(mockIo, mockSocket, mockState, 'support-room');

      handler({ role: 'customer' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });
});
