const envalid = require('envalid');
const crypto = require('crypto');

const env = envalid.cleanEnv(process.env, {
  NODE_ENV: envalid.str({ choices: ['development', 'staging', 'production'], default: 'development' }),
  PORT: envalid.port({ default: 3000 }),
  PUBLIC_URL: envalid.str({ default: '' }),
  
  SESSION_SECRET: envalid.str({ 
    default: process.env.NODE_ENV === 'production' ? undefined : 'dev-session-secret',
    desc: 'Session secret for Express sessions'
  }),
  COOKIE_SECRET: envalid.str({ 
    default: process.env.NODE_ENV === 'production' 
      ? crypto.randomBytes(32).toString('hex') 
      : 'dev-cookie-secret',
    desc: 'Cookie signing secret'
  }),
  SESSION_TTL_MS: envalid.num({ default: 43200000 }),
  
  REDIS_URL: envalid.str({ default: '' }),
  REDIS_NAMESPACE: envalid.str({ default: 'support' }),
  STATE_TTL_SECS: envalid.num({ default: 3600 }),
  
  TELEGRAM_BOT_TOKEN: envalid.str({ default: '' }),
  TELEGRAM_ADMIN_CHAT_ID: envalid.str({ default: '' }),
  
  TURN_SERVER_URL: envalid.str({ default: '' }),
  TURN_MODE: envalid.str({ choices: ['static', 'rest'], default: 'static' }),
  TURN_USERNAME: envalid.str({ default: '' }),
  TURN_CREDENTIAL: envalid.str({ default: '' }),
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
  
  // Part 16-17: JWT & MFA
  JWT_SECRET: envalid.str({ 
    default: process.env.NODE_ENV === 'production' 
      ? undefined 
      : 'dev-jwt-secret-change-in-production',
    desc: 'JWT signing secret (min 32 chars)'
  }),
  JWT_ACCESS_TTL: envalid.num({ default: 900 }),
  JWT_REFRESH_TTL: envalid.num({ default: 604800 }),
  MFA_ISSUER: envalid.str({ default: 'AdminAra' }),
  
  // Part 17: TURN TTL
  TURN_TTL: envalid.num({ default: 300 }),
  
  // Part 19: GDPR/KVKK
  RETENTION_DAYS: envalid.num({ default: 30 }),
  ENABLE_PII_MASKING: envalid.bool({ default: true }),
  ENCRYPTION_KEY: envalid.str({ default: '' }),
  
  // Part 6: Adaptive Bitrate
  ADAPTIVE_BITRATE: envalid.bool({ default: true }),
  MIN_BITRATE: envalid.num({ default: 300000 }),
  MAX_BITRATE: envalid.num({ default: 1500000 }),
  BATTERY_THRESHOLD: envalid.num({ default: 0.2 }),
}, {
  strict: false,
});

module.exports = env;
