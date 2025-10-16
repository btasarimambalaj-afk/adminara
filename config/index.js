const crypto = require('crypto');

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  PUBLIC_URL: process.env.PUBLIC_URL || '',
  
  SESSION_SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  COOKIE_SECRET: process.env.COOKIE_SECRET || (process.env.NODE_ENV === 'production' ? crypto.randomBytes(32).toString('hex') : 'dev-cookie-secret'),
  SESSION_TTL_MS: parseInt(process.env.SESSION_TTL_MS) || 43200000,
  
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_NAMESPACE: process.env.REDIS_NAMESPACE || 'support',
  STATE_TTL_SECS: parseInt(process.env.STATE_TTL_SECS) || 3600,
  
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
  
  TURN_SERVER_URL: process.env.TURN_SERVER_URL || '',
  TURN_MODE: process.env.TURN_MODE || 'static',
  TURN_USERNAME: process.env.TURN_USERNAME || '',
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || '',
  TURN_SECRET: process.env.TURN_SECRET || '',
  TURN_TTL: parseInt(process.env.TURN_TTL) || 300,
  
  MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS) || 50,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  ROOM_TIMEOUT_MS: parseInt(process.env.ROOM_TIMEOUT_MS) || 60000,
  
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
  ALLOWED_METRICS_ORIGINS: process.env.ALLOWED_METRICS_ORIGINS || '',
  
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  METRICS_AUTH: process.env.METRICS_AUTH || 'Basic YWRtaW46c2VjcmV0',
  
  DEBUG_STATE: process.env.DEBUG_STATE === 'true',
  ENABLE_CSRF: process.env.ENABLE_CSRF !== 'false' && process.env.NODE_ENV === 'production',
  ENABLE_QUEUE: process.env.ENABLE_QUEUE === 'true',
  
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  JWT_ACCESS_TTL: parseInt(process.env.JWT_ACCESS_TTL) || 900,
  JWT_REFRESH_TTL: parseInt(process.env.JWT_REFRESH_TTL) || 604800,
  MFA_ISSUER: process.env.MFA_ISSUER || 'AdminAra',
  
  RETENTION_DAYS: parseInt(process.env.RETENTION_DAYS) || 30,
  ENABLE_PII_MASKING: process.env.ENABLE_PII_MASKING !== 'false',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  
  ADAPTIVE_BITRATE: process.env.ADAPTIVE_BITRATE !== 'false',
  MIN_BITRATE: parseInt(process.env.MIN_BITRATE) || 300000,
  MAX_BITRATE: parseInt(process.env.MAX_BITRATE) || 1500000,
  BATTERY_THRESHOLD: parseFloat(process.env.BATTERY_THRESHOLD) || 0.2,
  
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

module.exports = env;
