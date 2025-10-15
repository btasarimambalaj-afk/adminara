// jest.deep.config.js - Deep Testing Configuration

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/integration/**/*.test.js',
    '**/tests/security/**/*.test.js'
  ],
  collectCoverageFrom: [
    'server.js',
    'utils/**/*.js',
    'routes/**/*.js',
    'socket/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js']
};
