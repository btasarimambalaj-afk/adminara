const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

module.exports = state => {
  const router = express.Router();

  // Swagger API documentation
  router.use('/api-docs', swaggerUi.serve);
  router.get(
    '/api-docs',
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AdminAra API Docs',
    })
  );

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
   *     description: Returns detailed service health status including memory, connections, and component health
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [ok, degraded]
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 admin:
   *                   type: boolean
   *                 customers:
   *                   type: integer
   *                 channel:
   *                   type: string
   *                 connections:
   *                   type: integer
   *                 uptime:
   *                   type: number
   *                 memory:
   *                   type: object
   *                   properties:
   *                     rss:
   *                       type: string
   *                     heapUsed:
   *                       type: string
   *                     heapTotal:
   *                       type: string
   *                 services:
   *                   type: object
   *                   properties:
   *                     telegram:
   *                       type: string
   *                     redis:
   *                       type: string
   *                     queue:
   *                       type: string
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
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      },
      services: {
        telegram: telegramConfigured ? 'ok' : 'not_configured',
        redis: redisHealthy ? 'ok' : 'unavailable',
        queue: queueHealthy ? 'ok' : 'unavailable',
      },
      webrtc: {
        activeSessions: state.customerSockets.size,
        reconnectAttempts: state.reconnectAttempts || 0,
        turnServers: process.env.TURN_SERVER_URL ? 'configured' : 'none',
      },
    });
  });

  /**
   * @swagger
   * /ready:
   *   get:
   *     summary: Readiness check endpoint
   *     description: Fast readiness check for load balancers (no Redis dependency). Ready if uptime > 5s and memory < 400MB
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ready:
   *                   type: boolean
   *                   example: true
   *                 uptime:
   *                   type: integer
   *                   example: 120
   *                 memory:
   *                   type: string
   *                   example: 256MB
   *       503:
   *         description: Service is not ready
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ready:
   *                   type: boolean
   *                   example: false
   *                 reason:
   *                   type: string
   *                   enum: [cold_start, high_memory]
   *                 uptime:
   *                   type: integer
   *                 memory:
   *                   type: string
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
        memory: heapUsedMB + 'MB',
      });
    } else {
      res.status(503).json({
        ready: false,
        reason: uptime <= 5 ? 'cold_start' : 'high_memory',
        uptime: Math.floor(uptime),
        memory: heapUsedMB + 'MB',
      });
    }
  });

  // Rate limiter for ICE servers (DDoS protection)
  const iceServersLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * @swagger
   * /config/ice-servers:
   *   get:
   *     summary: Get ICE servers configuration
   *     description: Returns STUN/TURN server configuration for WebRTC. TURN credentials are time-limited (5 minutes)
   *     tags: [WebRTC]
   *     responses:
   *       200:
   *         description: ICE servers configuration
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 iceServers:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       urls:
   *                         type: string
   *                         example: stun:stun.l.google.com:19302
   *                       username:
   *                         type: string
   *                       credential:
   *                         type: string
   *       429:
   *         description: Too many requests (rate limit: 10/minute)
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
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
    }
  });

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Prometheus metrics endpoint
   *     description: Returns Prometheus-formatted metrics including HTTP requests, WebRTC events, business metrics, and error tracking
   *     tags: [Monitoring]
   *     security:
   *       - metricsAuth: []
   *     responses:
   *       200:
   *         description: Prometheus metrics
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: |
   *                 # HELP http_request_duration_seconds Duration of HTTP requests
   *                 # TYPE http_request_duration_seconds histogram
   *                 http_request_duration_seconds_bucket{le="0.1"} 100
   *       401:
   *         description: Unauthorized (requires Basic auth in production)
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

  // Telegram proxy endpoint
  router.use('/api/telegram', require('./telegram'));
  
  // Test automation API
  router.use('/api/test', require('./test-api'));

  return router;
};
