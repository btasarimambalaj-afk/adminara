const envalid = require('envalid');

const env = envalid.cleanEnv(process.env, {
  NODE_ENV: envalid.str({ choices: ['development', 'staging', 'production'], default: 'development' }),
  PORT: envalid.port({ default: 3000 }),
  PUBLIC_URL: envalid.url({ default: 'http://localhost:3000' }),
  
  COOKIE_SECRET: envalid.str({ default: 'dev-secret' }),
  SESSION_TTL_MS: envalid.num({ default: 43200000 }),
  
  REDIS_URL: envalid.str({ default: '' }),
  REDIS_NAMESPACE: envalid.str({ default: 'support' }),
  STATE_TTL_SECS: envalid.num({ default: 3600 }),
  
  TELEGRAM_BOT_TOKEN: envalid.str({ default: '' }),
  TELEGRAM_ADMIN_CHAT_ID: envalid.str({ default: '' }),
  
  TURN_URL: envalid.str({ default: '' }),
  TURN_MODE: envalid.str({ choices: ['static', 'rest'], default: 'static' }),
  TURN_USER: envalid.str({ default: '' }),
  TURN_PASS: envalid.str({ default: '' }),
  TURN_SECRET: envalid.str({ default: '' }),
  
  MAX_CONNECTIONS: envalid.num({ default: 50 }),
  RATE_LIMIT_MAX: envalid.num({ default: 100 }),
  ROOM_TIMEOUT_MS: envalid.num({ default: 60000 }),
  
  ALLOWED_ORIGINS: envalid.str({ default: '' }),
  ALLOWED_METRICS_ORIGINS: envalid.str({ default: '' }),
  
  SENTRY_DSN: envalid.str({ default: '' }),
  METRICS_AUTH: envalid.str({ default: 'Basic YWRtaW46c2VjcmV0' }),
  
  DEBUG_STATE: envalid.bool({ default: false }),
  ENABLE_CSRF: envalid.bool({ default: false }),
  ENABLE_QUEUE: envalid.bool({ default: false }),
}, {
  strict: false,
});

module.exports = env;
