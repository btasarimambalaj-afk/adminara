const Joi = require('joi');

const schemas = {
  otp: Joi.object({
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required(),
  }),

  rtcOffer: Joi.object({
    offer: Joi.object({
      type: Joi.string().valid('offer').required(),
      sdp: Joi.string().required(),
    }).required(),
  }),

  rtcAnswer: Joi.object({
    answer: Joi.object({
      type: Joi.string().valid('answer').required(),
      sdp: Joi.string().required(),
    }).required(),
  }),

  iceCandidate: Joi.object({
    candidate: Joi.object({
      candidate: Joi.string().required(),
      sdpMLineIndex: Joi.number().required(),
      sdpMid: Joi.string().allow(null),
      usernameFragment: Joi.string().optional(),
    }).required(),
  }),

  channelJoin: Joi.object({
    isAdmin: Joi.boolean().required(),
  }),
};

const validate = (schema, data) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};

module.exports = { schemas, validate };
