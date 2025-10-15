function mockSocket(overrides = {}) {
  return {
    id: `socket-${Date.now()}`,
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    handshake: {
      address: '127.0.0.1',
      auth: {},
      headers: {},
      query: {},
    },
    request: { headers: {} },
    ...overrides,
  };
}

function mockBot() {
  return {
    sendMessage: jest.fn(async () => ({ ok: true, message_id: 123 })),
  };
}

function mockState(overrides = {}) {
  return {
    adminSocket: null,
    customerSockets: new Map(),
    channelStatus: 'AVAILABLE',
    otpStore: new Map(),
    connectionCount: 0,
    bot: mockBot(),
    ...overrides,
  };
}

module.exports = { mockSocket, mockBot, mockState };
