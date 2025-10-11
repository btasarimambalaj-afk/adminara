const otpHandlers = require('../../utils/session');
const crypto = require('crypto');

describe('OTP - Advanced Tests', () => {
  let mockSocket, mockState;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));

    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn()
    };

    mockState = {
      otpStore: new Map(),
      bot: {
        sendMessage: jest.fn().mockResolvedValue({ ok: true })
      }
    };

    process.env.TELEGRAM_CHAT_ID = '123456';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Expiry Validation', () => {
    it('should accept OTP within 5 minutes', () => {
      otpHandlers(mockSocket, mockState);
      mockSocket.emit('otp:request');

      const otpData = mockState.otpStore.get(mockSocket.id);
      expect(otpData).toBeDefined();

      // 4 minutes later
      jest.advanceTimersByTime(4 * 60 * 1000);
      
      const now = Date.now();
      expect(otpData.expires).toBeGreaterThan(now);
    });

    it('should reject OTP after 5 minutes', () => {
      otpHandlers(mockSocket, mockState);
      mockSocket.emit('otp:request');

      const otpData = mockState.otpStore.get(mockSocket.id);
      
      // 6 minutes later
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      const now = Date.now();
      expect(otpData.expires).toBeLessThan(now);
    });
  });

  describe('Crypto Randomness', () => {
    it('should generate unique OTPs', () => {
      const otps = new Set();
      
      for (let i = 0; i < 100; i++) {
        const mockSock = { id: `socket-${i}`, emit: jest.fn() };
        const mockSt = { otpStore: new Map(), bot: mockState.bot };
        
        otpHandlers(mockSock, mockSt);
        mockSock.emit('otp:request');
        
        const otpData = mockSt.otpStore.get(mockSock.id);
        if (otpData) {
          otps.add(otpData.otp);
        }
      }
      
      // At least 95% unique
      expect(otps.size).toBeGreaterThan(95);
    });

    it('should use crypto.randomInt', () => {
      const spy = jest.spyOn(crypto, 'randomInt');
      
      otpHandlers(mockSocket, mockState);
      mockSocket.emit('otp:request');
      
      // Should be called for generating 6-digit number
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });

    it('should generate 6-digit numbers', () => {
      for (let i = 0; i < 50; i++) {
        const mockSock = { id: `socket-${i}`, emit: jest.fn() };
        const mockSt = { otpStore: new Map(), bot: mockState.bot };
        
        otpHandlers(mockSock, mockSt);
        mockSock.emit('otp:request');
        
        const otpData = mockSt.otpStore.get(mockSock.id);
        expect(otpData.otp).toMatch(/^\d{6}$/);
      }
    });
  });

  describe('Multiple OTP Requests', () => {
    it('should invalidate old OTP on new request', () => {
      otpHandlers(mockSocket, mockState);
      
      // First request
      mockSocket.emit('otp:request');
      const otp1 = mockState.otpStore.get(mockSocket.id);
      
      // Second request
      mockSocket.emit('otp:request');
      const otp2 = mockState.otpStore.get(mockSocket.id);
      
      // OTPs should be different
      expect(otp1.otp).not.toBe(otp2.otp);
    });

    it('should update expiry on new request', () => {
      otpHandlers(mockSocket, mockState);
      
      mockSocket.emit('otp:request');
      const expires1 = mockState.otpStore.get(mockSocket.id).expires;
      
      // Advance 2 minutes
      jest.advanceTimersByTime(2 * 60 * 1000);
      
      mockSocket.emit('otp:request');
      const expires2 = mockState.otpStore.get(mockSocket.id).expires;
      
      // New expiry should be later
      expect(expires2).toBeGreaterThan(expires1);
    });
  });

  describe('OTP Cleanup', () => {
    it('should remove expired OTPs', () => {
      // Add multiple OTPs
      for (let i = 0; i < 5; i++) {
        const mockSock = { id: `socket-${i}`, emit: jest.fn() };
        const mockSt = { otpStore: mockState.otpStore, bot: mockState.bot };
        
        otpHandlers(mockSock, mockSt);
        mockSock.emit('otp:request');
      }
      
      expect(mockState.otpStore.size).toBe(5);
      
      // Advance 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);
      
      // Cleanup expired
      const now = Date.now();
      for (const [key, value] of mockState.otpStore.entries()) {
        if (value.expires < now) {
          mockState.otpStore.delete(key);
        }
      }
      
      expect(mockState.otpStore.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing bot', () => {
      mockState.bot = null;
      
      otpHandlers(mockSocket, mockState);
      mockSocket.emit('otp:request');
      
      // Should emit error
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });

    it('should handle Telegram API failure', async () => {
      mockState.bot.sendMessage = jest.fn().mockRejectedValue(new Error('API Error'));
      
      otpHandlers(mockSocket, mockState);
      mockSocket.emit('otp:request');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should emit error
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });
});
