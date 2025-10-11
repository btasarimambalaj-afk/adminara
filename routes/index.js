const express = require('express');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

module.exports = (state) => {
  const router = express.Router();

  router.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
      status: 'ok',
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
      telegram: state.bot ? 'connected' : 'disabled'
    });
  });

  router.get('/config/ice-servers', async (req, res) => {
    try {
      const { getICEServers } = require('../utils/turn-credentials');
      const iceServers = await getICEServers();
      res.json({ iceServers });
    } catch (error) {
      logger.error('ICE servers error', { error: error.message });
      res.json({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    }
  });

  router.get('/metrics', async (req, res) => {
    const authHeader = req.headers.authorization;
    const validAuth = process.env.METRICS_AUTH || 'Basic YWRtaW46c2VjcmV0';
    
    if (process.env.NODE_ENV === 'production' && authHeader !== validAuth) {
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
