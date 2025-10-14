const Joi = require('joi');

/**
 * Socket.IO Event Payload Validators
 */
const schemas = {
  'room:join': Joi.object({
    isAdmin: Joi.boolean(),
    customerName: Joi.string().max(100).optional()
  }),
  
  'chat:send': Joi.object({
    message: Joi.string().min(1).max(500).required(),
    timestamp: Joi.number().optional()
  }),
  
  'rtc:description': Joi.object({
    description: Joi.object({
      type: Joi.string().valid('offer', 'answer').required(),
      sdp: Joi.string().min(10).max(10000).required()
    }).required(),
    restart: Joi.boolean().optional()
  }),
  
  'rtc:ice:candidate': Joi.object({
    candidate: Joi.object({
      candidate: Joi.string().max(500).required(),
      sdpMid: Joi.string().max(50).optional(),
      sdpMLineIndex: Joi.number().optional()
    }).required()
  }),
  
  'customer:update:name': Joi.object({
    customerName: Joi.string().min(1).max(100).required()
  })
};

/**
 * Validate Socket.IO event payload
 */
function validateSocketPayload(eventName, data) {
  const schema = schemas[eventName];
  
  if (!schema) {
    return { valid: true, data }; // No validation for this event
  }
  
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    return {
      valid: false,
      error: error.details.map(d => d.message).join(', '),
      data: null
    };
  }
  
  return { valid: true, data: value };
}

/**
 * Validate WebRTC SDP
 */
function validateSDP(sdp) {
  if (!sdp || typeof sdp !== 'string') {
    return { valid: false, error: 'SDP must be a string' };
  }
  
  // Basic SDP validation
  if (!sdp.includes('v=0')) {
    return { valid: false, error: 'Invalid SDP: missing version' };
  }
  
  if (!sdp.includes('m=')) {
    return { valid: false, error: 'Invalid SDP: missing media description' };
  }
  
  // Check for malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(sdp)) {
      return { valid: false, error: 'Invalid SDP: malicious content detected' };
    }
  }
  
  return { valid: true };
}

module.exports = {
  validateSocketPayload,
  validateSDP
};
