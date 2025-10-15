// utils/feature-flags.js - Feature Flags Management

const config = require('../config');

const flags = {
  ENABLE_QUEUE: config.ENABLE_QUEUE,
  ENABLE_CSRF: config.ENABLE_CSRF,
  ENABLE_PII_MASKING: config.ENABLE_PII_MASKING,
  ADAPTIVE_BITRATE: config.ADAPTIVE_BITRATE,
  DEBUG_STATE: config.DEBUG_STATE
};

function isFeatureEnabled(feature) {
  return flags[feature] === true;
}

function getFeatureFlags() {
  return { ...flags };
}

module.exports = {
  isFeatureEnabled,
  getFeatureFlags,
  flags
};
