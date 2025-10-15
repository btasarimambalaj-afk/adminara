// Global Jest setup for AdminAra
// - Extends default timeouts for integration/e2e
// - Provides Sentry mock if not present

jest.setTimeout(10000); // 10s for integration/e2e stability

// If tests import @sentry/node and no mock exists, provide a noop.
try {
  // eslint-disable-next-line global-require
  require('@sentry/node');
} catch (e) {
  jest.mock('@sentry/node', () => ({
    init: () => {},
    Handlers: {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => next(err),
    },
    captureException: () => {},
    setUser: () => {},
    setContext: () => {},
  }));
}

// In case fetch is used in tests
if (typeof global.fetch === 'undefined') {
  // Lightweight fetch polyfill using node: http/https is overkill; tests rarely hit network.
  global.fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
}
