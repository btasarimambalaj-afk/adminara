const Joi = require('joi');
const logger = require('../utils/logger');

// WebRTC signaling schemas
const schemas = {
  offer: Joi.object({
    type: Joi.string().valid('offer').required(),
    sdp: Joi.string().required(),
  }),

  answer: Joi.object({
    type: Joi.string().valid('answer').required(),
    sdp: Joi.string().required(),
  }),

  iceCandidate: Joi.object({
    candidate: Joi.string().required(),
    sdpMid: Joi.string().allow(null),
    sdpMLineIndex: Joi.number().allow(null),
  }),

  joinChannel: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
  }),
};

/**
 * Validate socket message against schema
 * @param {string} event - Event name
 * @param {*} data - Message data
 * @returns {Object} { valid: boolean, error?: string, value?: * }
 */
function validateMessage(event, data) {
  const schema = schemas[event];

  if (!schema) {
    return { valid: true, value: data }; // No schema = allow
  }

  const { error, value } = schema.validate(data);

  if (error) {
    logger.warn('Socket message validation failed', {
      event,
      error: error.message,
    });
    return { valid: false, error: error.message };
  }

  return { valid: true, value };
}

/**
 * Socket validation middleware
 * @param {string} event - Event name
 * @returns {Function} Middleware function
 */
function validateSocket(event) {
  return (data, next) => {
    const result = validateMessage(event, data);

    if (!result.valid) {
      return next(new Error(result.error));
    }

    next();
  };
}

module.exports = { validateMessage, validateSocket, schemas };
