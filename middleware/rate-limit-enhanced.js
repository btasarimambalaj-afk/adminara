// middleware/rate-limit-enhanced.js - Enhanced Rate Limiting

const rateLimit = require('express-rate-limit');

function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 60000,
    max: options.max || 100,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
}

const rateLimiters = {
  global: createRateLimiter({ windowMs: 60000, max: 100 }),
  admin: createRateLimiter({ windowMs: 60000, max: 50, message: 'Too many admin requests' }),
  customer: createRateLimiter({ windowMs: 60000, max: 100 }),
  otp: createRateLimiter({ windowMs: 300000, max: 5, message: 'Too many OTP requests' }),
  auth: createRateLimiter({ windowMs: 900000, max: 10 })
};

class SocketRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 1000;
    this.max = options.max || 10;
    this.clients = new Map();
  }

  check(socketId) {
    const now = Date.now();
    const client = this.clients.get(socketId) || { count: 0, resetTime: now + this.windowMs };

    if (now > client.resetTime) {
      client.count = 0;
      client.resetTime = now + this.windowMs;
    }

    client.count++;
    this.clients.set(socketId, client);

    if (this.clients.size > 1000) {
      for (const [id, data] of this.clients.entries()) {
        if (now > data.resetTime) this.clients.delete(id);
      }
    }

    return client.count <= this.max;
  }
}

const socketRateLimiters = {
  'rtc:description': new SocketRateLimiter({ windowMs: 1000, max: 5 }),
  'rtc:ice:candidate': new SocketRateLimiter({ windowMs: 1000, max: 20 }),
  'chat:send': new SocketRateLimiter({ windowMs: 1000, max: 3 })
};

function socketRateLimit(eventName) {
  return (socket, next) => {
    const limiter = socketRateLimiters[eventName];
    if (!limiter || limiter.check(socket.id)) return next();
    next(new Error('Rate limit exceeded'));
  };
}

module.exports = { rateLimiters, socketRateLimit, SocketRateLimiter };
