// jest.setup.js - Jest Test Environment Setup

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing';
process.env.COOKIE_SECRET = 'test-cookie-secret-key-for-testing';
process.env.PORT = '3001';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.TURN_SERVER_URL = 'turn:test.example.com:3478';
process.env.TURN_USERNAME = 'test';
process.env.TURN_CREDENTIAL = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(15000);
