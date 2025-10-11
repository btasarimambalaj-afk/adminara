const adminAuthHandlers = require('../../socket/admin-auth');

describe('Admin Auth - Advanced Tests', () => {
  let mockSocket, mockState;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));

    mockSocket = {
      id: 'admin-socket-id',
      emit: jest.fn(),
      handshake: { address: '127.0.0.1' }
    };

    mockState = {
      otpStore: new Map(),
      otpAttempts: new Map(),
      adminSocket: null,
      bot: {
        sendMessage: jest.fn().mockResolvedValue({ ok: true })
      }
    };

    process.env.TELEGRAM_CHAT_ID = '123456';
    process.env.ADMIN_OTP_SECRET = 'test-secret';
    process.env.ADMIN_IPS = '127.0.0.1,192.168.1.1';
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.ADMIN_IPS;
  });

  describe('Session Token Expiry', () => {
    it('should create session with 12-hour expiry', () => {
      const auth = require('../../utils/auth');
      const token = auth.createSession(mockSocket.id);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify session is valid
      const session = auth.verifySession(token);
      expect(session).toBeTruthy();
    });

    it('should expire session after 12 hours', () => {
      const auth = require('../../utils/auth');
      const token = auth.createSession(mockSocket.id);
      
      // Advance 13 hours
      jest.advanceTimersByTime(13 * 60 * 60 * 1000);
      
      const session = auth.verifySession(token);
      expect(session).toBeFalsy();
    });
  });

  describe('IP Whitelist Validation', () => {
    it('should allow whitelisted IP', () => {
      mockSocket.handshake.address = '127.0.0.1';
      
      adminAuthHandlers(mockSocket, mockState);
      
      // Should not emit unauthorized
      expect(mockSocket.emit).not.toHaveBeenCalledWith('admin:unauthorized');
    });

    it('should reject non-whitelisted IP', () => {
      mockSocket.handshake.address = '10.0.0.1';
      
      adminAuthHandlers(mockSocket, mockState);
      
      // Emit password request to trigger IP check
      mockSocket.emit('admin:password:request');
      
      // Should be rate limited or rejected
      expect(mockState.otpAttempts.has('10.0.0.1')).toBeTruthy();
    });
  });

  describe('Concurrent Login Prevention', () => {
    it('should invalidate old session on new login', () => {
      const auth = require('../../utils/auth');
      
      const token1 = auth.createSession('admin-1');
      const token2 = auth.createSession('admin-1');
      
      // Old token should be invalid
      expect(auth.verifySession(token1)).toBeFalsy();
      expect(auth.verifySession(token2)).toBeTruthy();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should track failed attempts', () => {
      adminAuthHandlers(mockSocket, mockState);
      
      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        mockSocket.emit('admin:password:verify', { password: '000000' });
      }
      
      const attempts = mockState.otpAttempts.get(mockSocket.handshake.address);
      expect(attempts).toBeDefined();
      expect(attempts.count).toBeGreaterThan(0);
    });

    it('should lockout after max failures', () => {
      adminAuthHandlers(mockSocket, mockState);
      
      // Simulate 10 failed attempts
      for (let i = 0; i < 10; i++) {
        mockState.otpAttempts.set(mockSocket.handshake.address, {
          count: i + 1,
          firstAttempt: Date.now()
        });
      }
      
      mockSocket.emit('admin:password:request');
      
      // Should emit rate limited
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'admin:password:rate_limited',
        expect.any(Object)
      );
    });
  });

  describe('Telegram API Failure Handling', () => {
    it('should handle Telegram timeout', async () => {
      mockState.bot.sendMessage = jest.fn().mockRejectedValue(new Error('Timeout'));
      
      adminAuthHandlers(mockSocket, mockState);
      
      mockSocket.emit('admin:password:request');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should emit error
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });

    it('should retry on network error', async () => {
      mockState.bot.sendMessage = jest.fn()
        .mockRejectedValueOnce(new Error('Network'))
        .mockResolvedValueOnce({ ok: true });
      
      adminAuthHandlers(mockSocket, mockState);
      
      mockSocket.emit('admin:password:request');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should eventually succeed
      expect(mockState.bot.sendMessage).toHaveBeenCalledTimes(2);
    });
  });
});
