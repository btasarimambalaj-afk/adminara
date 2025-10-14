const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// PII masking format
const maskPiiFormat = winston.format((info) => {
  if (!config.ENABLE_PII_MASKING) return info;
  
  const piiFields = ['email', 'phone', 'name', 'ip'];
  const masked = { ...info };
  
  piiFields.forEach(field => {
    if (masked[field]) {
      const encryption = require('./encryption');
      masked[field] = encryption.maskPii(masked[field]);
    }
  });
  
  return masked;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    maskPiiFormat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'adminara-webrtc' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880,
      maxFiles: 5
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