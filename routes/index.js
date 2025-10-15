const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

module.exports = (state) => {
  const router = express.Router();
  
  // Swagger API documentation
  router.use('/api-docs', swaggerUi.serve);
  router.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AdminAra API Docs'
  }));
  
  // JSON spec endpoint
  router.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   *       503:
   *         description: Service is degraded
   */
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
  
  /**
   * @swagger
   * /ready:
   *   get:
   *     summary: Readiness check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   *       503:
   *         description: Service is not ready
   */
  router.get('/ready', async (req, res) => {
    // Fast readiness check (no Redis dependency)
    // Use this for health checks with short timeout
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // Ready if uptime > 5s and memory < 400MB
    const ready = uptime > 5 && heapUsedMB < 400;
    
    if (ready) {
      res.status(200).json({ 
        ready: true, 
        uptime: Math.floor(uptime),
        memory: heapUsedMB + 'MB'
      });
    } else {
      res.status(503).json({ 
        ready: false, 
        reason: uptime <= 5 ? 'cold_start' : 'high_memory',
        uptime: Math.floor(uptime),
        memory: heapUsedMB + 'MB'
      });
    }
  });

  // Rate limiter for ICE servers (DDoS protection)
  const iceServersLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  /**
   * @swagger
   * /config/ice-servers:
   *   get:
   *     summary: Get ICE servers configuration
   *     tags: [WebRTC]
   *     responses:
   *       200:
   *         description: ICE servers configuration
   *       500:
   *         description: ICE servers unavailable
   */
  router.get('/config/ice-servers', iceServersLimiter, async (req, res) => {
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

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Prometheus metrics endpoint
   *     tags: [Monitoring]
   *     security:
   *       - metricsAuth: []
   *     responses:
   *       200:
   *         description: Prometheus metrics
   *       401:
   *         description: Unauthorized
   */
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
