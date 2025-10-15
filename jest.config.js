module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  testTimeout: 10000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['socket/**/*.js', 'utils/**/*.js', 'routes/**/*.js', '!**/node_modules/**'],
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 40,
      lines: 35,
      statements: 35,
    },
  },
};
