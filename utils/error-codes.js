// Multi-Language Error Codes
const ERROR_CODES = {
  // Connection Errors (1xxx)
  1001: {
    code: 'ICE_FAILED',
    en: 'Connection failed. Retrying...',
    tr: 'Bağlantı başarısız. Yeniden deneniyor...',
    severity: 'high',
  },
  1002: {
    code: 'SILENCE_DETECTED',
    en: 'No audio detected. Please check your microphone.',
    tr: 'Ses algılanamadı. Lütfen mikrofonunuzu kontrol edin.',
    severity: 'medium',
  },
  1003: {
    code: 'PEER_DISCONNECTED',
    en: 'Peer disconnected. Reconnecting...',
    tr: 'Karşı taraf bağlantısı koptu. Yeniden bağlanılıyor...',
    severity: 'high',
  },

  // Queue Errors (2xxx)
  2001: {
    code: 'QUEUE_FULL',
    en: 'Queue is full. Please try again later.',
    tr: 'Kuyruk dolu. Lütfen daha sonra tekrar deneyin.',
    severity: 'medium',
  },
  2002: {
    code: 'QUEUE_TIMEOUT',
    en: 'Queue timeout. Please rejoin.',
    tr: 'Kuyruk zaman aşımı. Lütfen tekrar katılın.',
    severity: 'low',
  },

  // Media Errors (3xxx)
  3001: {
    code: 'MEDIA_PERMISSION_DENIED',
    en: 'Microphone permission denied.',
    tr: 'Mikrofon izni reddedildi.',
    severity: 'critical',
  },
  3002: {
    code: 'MEDIA_DEVICE_NOT_FOUND',
    en: 'No microphone found.',
    tr: 'Mikrofon bulunamadı.',
    severity: 'critical',
  },

  // Server Errors (5xxx)
  5001: {
    code: 'SERVER_ERROR',
    en: 'Server error. Please try again.',
    tr: 'Sunucu hatası. Lütfen tekrar deneyin.',
    severity: 'high',
  },
};

function getError(code, lang = 'tr') {
  const error = ERROR_CODES[code];
  if (!error) return { code: 'UNKNOWN', message: 'Unknown error', severity: 'low' };

  return {
    code: error.code,
    message: error[lang] || error.en,
    severity: error.severity,
  };
}

function logError(code, context = {}) {
  const error = getError(code);
  const logger = require('./logger');

  const logData = {
    errorCode: code,
    errorName: error.code,
    severity: error.severity,
    ...context,
  };

  if (error.severity === 'critical' || error.severity === 'high') {
    logger.error(error.message, logData);
  } else if (error.severity === 'medium') {
    logger.warn(error.message, logData);
  } else {
    logger.info(error.message, logData);
  }

  return error;
}

module.exports = {
  ERROR_CODES,
  getError,
  logError,
};
