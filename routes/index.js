const express = require('express');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

module.exports = (state) => {
  const router = express.Router();

  router.get('/health', async (req, res) => {
    const memUsage = process.memoryUsage();
    const stateStore = require('../utils/state-store');
    const telegramQueue = require('../jobs/telegram');
    
    let redisHealthy = true;
    let queueHealthy = true;
    
    try {
      redisHealthy = await stateStore.isHealthy();
    } catch (e) {
      redisHealthy = !process.env.REDIS_URL; // OK if Redis not configured
    }
    
    try {
      queueHealthy = await telegramQueue.isHealthy();
    } catch (e) {
      queueHealthy = !process.env.TELEGRAM_BOT_TOKEN; // OK if Telegram not configured
    }
    
    const telegramConfigured = state.bot && process.env.TELEGRAM_ADMIN_CHAT_ID;
    const allHealthy = redisHealthy && queueHealthy;
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      admin: !!state.adminSocket,
      customers: state.customerSockets.size,
      channel: state.channelStatus,
      connections: state.connectionCount,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      services: {
        telegram: telegramConfigured ? 'ok' : 'not_configured',
        redis: redisHealthy ? 'ok' : 'unavailable',
        queue: queueHealthy ? 'ok' : 'unavailable'
      },
      webrtc: {
        activeSessions: state.customerSockets.size,
        reconnectAttempts: state.reconnectAttempts || 0,
        turnServers: process.env.TURN_SERVER_URL ? 'configured' : 'none'
      }
    });
  });
  
  router.get('/ready', async (req, res) => {
    const stateStore = require('../utils/state-store');
    const redisHealthy = await stateStore.isHealthy();
    
    if (redisHealthy || !process.env.REDIS_URL) {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false, reason: 'redis_unavailable' });
    }
  });

  router.get('/config/ice-servers', async (req, res) => {
    try {
      const { getICEServers } = require('../utils/turn-credentials');
      const iceServers = await getICEServers();
      res.json({ iceServers });
    } catch (error) {
      logger.error('ICE servers error', { error: error.message });
      res.status(500).json({ 
        error: 'ICE servers unavailable',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] 
      });
    }
  });

  router.get('/metrics', async (req, res) => {
    const authHeader = req.headers.authorization;
    const validAuth = process.env.METRICS_AUTH || 'Basic YWRtaW46c2VjcmV0';
    const isTest = process.env.NODE_ENV === 'test';
    
    if (process.env.NODE_ENV === 'production' && !isTest && authHeader !== validAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Update active locks gauge
    const rateLimiter = require('../utils/rate-limiter');
    metrics.otpActiveLocks.set(rateLimiter.getActiveLocks());
    
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  });

  return router;
};
