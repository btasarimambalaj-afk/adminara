const otpHandlers = require('../../utils/session');

describe('OTP Handlers', () => {
  let mockSocket, mockState;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
    };

    mockState = {
      otpStore: new Map(),
      bot: {
        sendMessage: jest.fn().mockResolvedValue({}),
      },
    };

    process.env.TELEGRAM_CHAT_ID = '123456';
  });

  it('should generate 6-digit OTP', done => {
    otpHandlers(mockSocket, mockState);

    mockSocket.emit.mockImplementation(event => {
      if (event === 'otp:sent') {
        const otpData = mockState.otpStore.get(mockSocket.id);
        expect(otpData.otp).toMatch(/^\d{6}$/);
        done();
      }
    });

    mockSocket.emit('otp:request');
  });

  it('should set expiry time', done => {
    otpHandlers(mockSocket, mockState);

    mockSocket.emit.mockImplementation(event => {
      if (event === 'otp:sent') {
        const otpData = mockState.otpStore.get(mockSocket.id);
        expect(otpData.expires).toBeGreaterThan(Date.now());
        done();
      }
    });

    mockSocket.emit('otp:request');
  });

  it('should send OTP via Telegram', done => {
    otpHandlers(mockSocket, mockState);

    mockSocket.emit.mockImplementation(event => {
      if (event === 'otp:sent') {
        expect(mockState.bot.sendMessage).toHaveBeenCalled();
        done();
      }
    });

    mockSocket.emit('otp:request');
  });

  it('should handle missing bot', done => {
    mockState.bot = null;

    otpHandlers(mockSocket, mockState);

    mockSocket.emit.mockImplementation(event => {
      if (event === 'error') {
        done();
      }
    });

    mockSocket.emit('otp:request');
  });
});
