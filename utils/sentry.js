const Sentry = require('@sentry/node');

function initSentry(app) {
  if (process.env.SENTRY_DSN) {
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

  console.log('⚠️ Sentry DSN not configured');
  return false;
}

function captureError(error, context = {}) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

function captureMessage(message, level = 'info') {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}

module.exports = { initSentry, captureError, captureMessage, Sentry };
