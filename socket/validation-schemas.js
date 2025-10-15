// socket/validation-schemas.js - Socket.IO Event Validation Schemas

const Joi = require('joi');

const schemas = {
  // WebRTC signaling
  'rtc:description': Joi.object({
    description: Joi.object({
      type: Joi.string().valid('offer', 'answer').required(),
      sdp: Joi.string().min(50).max(50000).required()
    }).required()
  }),

  'rtc:ice:candidate': Joi.object({
    candidate: Joi.object({
      candidate: Joi.string().max(1000).required(),
      sdpMLineIndex: Joi.number().integer().min(0).allow(null),
      sdpMid: Joi.string().max(100).allow(null)
    }).required()
  }),

  // Chat
  'chat:send': Joi.object({
    message: Joi.string().min(1).max(500).trim().required()
  }),

  // Room management
  'room:join': Joi.object({
    roomId: Joi.string().pattern(/^[a-zA-Z0-9-_]{1,50}$/).required(),
    userName: Joi.string().min(1).max(100).trim().optional()
  }),

  // Admin actions
  'admin:accept': Joi.object({
    customerId: Joi.string().pattern(/^[a-zA-Z0-9-_]{1,50}$/).required()
  }),

  'admin:reject': Joi.object({
    customerId: Joi.string().pattern(/^[a-zA-Z0-9-_]{1,50}$/).required(),
    reason: Joi.string().max(200).optional()
  })
};

// Validation middleware
function validateSocketEvent(eventName) {
  return (data, callback) => {
    const schema = schemas[eventName];
    
    if (!schema) {
      // No schema defined, allow through
      return callback(null, data);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(d => d.message).join(', ');
      return callback(new Error(`Validation failed: ${errors}`));
    }

    callback(null, value);
  };
}

module.exports = {
  schemas,
  validateSocketEvent
};
