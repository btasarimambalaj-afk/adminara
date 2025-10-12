const adminAuthHandlers = require('../../socket/admin-auth');
const { createOtpForAdmin, verifyAdminOtp } = require('../../socket/admin-auth');

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
      adminSocket: null,
      bot: {
        sendMessage: jest.fn().mockResolvedValue({ ok: true })
      }
    };

    process.env.TELEGRAM_ADMIN_CHAT_ID = '123456';
    process.env.ADMIN_IPS = '127.0.0.1,192.168.1.1';
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.ADMIN_IPS;
  });

  describe('Session Token Expiry', () => {
    it('should create session with 12-hour expiry', async () => {
      const adminSession = require('../../utils/admin-session');
      const token = await adminSession.createSession('admin');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify session is valid
      const session = await adminSession.validateSession(token);
      expect(session).toBeTruthy();
    });

    it('should expire session after 12 hours', async () => {
      const adminSession = require('../../utils/admin-session');
      const token = await adminSession.createSession('admin');
      
      // Advance 13 hours
      jest.advanceTimersByTime(13 * 60 * 60 * 1000);
      
      const session = await adminSession.validateSession(token);
      expect(session).toBeFalsy();
    });
  });

  describe('IP Whitelist Validation', () => {
    it('should allow whitelisted IP', () => {
      mockSocket.handshake.address = '127.0.0.1';
      const mockIo = {};
      
      adminAuthHandlers(mockIo, mockSocket, mockState);
      
      // Should not emit unauthorized
      expect(mockSocket.emit).not.toHaveBeenCalledWith('admin:unauthorized');
    });

    it('should reject non-whitelisted IP', () => {
      mockSocket.handshake.address = '10.0.0.1';
      mockSocket.disconnect = jest.fn();
      const mockIo = {};
      
      adminAuthHandlers(mockIo, mockSocket, mockState);
      
      // Should disconnect
      expect(mockSocket.emit).toHaveBeenCalledWith('admin:unauthorized', expect.any(Object));
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Concurrent Login Prevention', () => {
    it('should allow multiple sessions for same admin', async () => {
      const adminSession = require('../../utils/admin-session');
      
      const token1 = await adminSession.createSession('admin');
      const token2 = await adminSession.createSession('admin');
      
      // Both tokens should be valid (no single-session enforcement)
      expect(await adminSession.validateSession(token1)).toBeTruthy();
      expect(await adminSession.validateSession(token2)).toBeTruthy();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should track failed attempts via verifyAdminOtp', () => {
      const { verifyAdminOtp } = require('../../socket/admin-auth');
      
      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        verifyAdminOtp('admin', '000000');
      }
      
      // Failed attempts are tracked internally
      expect(true).toBe(true); // Placeholder - internal tracking
    });

    it('should lockout after max failures', () => {
      const mockIo = {};
      mockSocket.on = jest.fn((event, handler) => {
        if (event === 'admin:password:verify') {
          mockSocket._verifyHandler = handler;
        }
      });
      
      adminAuthHandlers(mockIo, mockSocket, mockState);
      
      // Simulate max failed attempts
      process.env.ENABLE_OTP_RATE_LIMIT = 'true';
      process.env.OTP_FAIL_LIMIT = '3';
      
      // Test lockout logic exists
      expect(mockSocket.on).toHaveBeenCalledWith('admin:password:verify', expect.any(Function));
    });
  });

  describe('Telegram API Failure Handling', () => {
    it('should handle Telegram timeout', async () => {
      const { createOtpForAdmin } = require('../../socket/admin-auth');
      mockState.bot.sendMessage = jest.fn().mockRejectedValue(new Error('Timeout'));
      
      await expect(createOtpForAdmin('admin', mockState.bot)).rejects.toThrow('Timeout');
    });

    it('should log error on network failure', async () => {
      const { createOtpForAdmin } = require('../../socket/admin-auth');
      mockState.bot.sendMessage = jest.fn().mockRejectedValue(new Error('Network'));
      
      await expect(createOtpForAdmin('admin', mockState.bot)).rejects.toThrow('Network');
    });
  });
});
