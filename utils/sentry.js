let Sentry = null;

try {
  Sentry = require('@sentry/node');
} catch (err) {
  console.log('⚠️ Sentry not installed - error tracking disabled');
}

function initSentry(app) {
  if (!Sentry || !process.env.SENTRY_DSN) {
    console.log('⚠️ Sentry not configured');
    return false;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
  });

  console.log('✅ Sentry initialized');
  return true;
}

function captureError(error, context = {}) {
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

function captureMessage(message, level = 'info') {
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}

module.exports = { initSentry, captureError, captureMessage, Sentry: Sentry || {} };
