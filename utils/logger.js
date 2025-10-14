const winston = require('winston');
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../config');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// PII masking format
const maskPiiFormat = winston.format((info) => {
  if (!config.ENABLE_PII_MASKING) return info;
  
  const encryption = require('./encryption');
  const piiFields = ['email', 'phone', 'name', 'ip', 'adminId', 'socketId'];
  const masked = { ...info };
  
  // Mask PII fields
  piiFields.forEach(field => {
    if (masked[field]) {
      masked[field] = encryption.maskPii(masked[field]);
    }
  });
  
  // Mask message content (email, phone patterns)
  if (masked.message && typeof masked.message === 'string') {
    // Email pattern
    masked.message = masked.message.replace(
      /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      (match, local, domain) => encryption.maskPii(match, 'email')
    );
    // Phone pattern (+905551234567)
    masked.message = masked.message.replace(
      /\+?\d{10,15}/g,
      (match) => encryption.maskPii(match, 'phone')
    );
  }
  
  return masked;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    maskPiiFormat(), // PII masking BEFORE json
    winston.format.json()
  ),
  defaultMeta: { service: 'adminara-webrtc', version: '1.3.8' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Child logger with context
logger.child = (context) => {
  return logger.child(context);
};

module.exports = logger;