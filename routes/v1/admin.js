const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * GET /v1/admin/queue
 * Get current queue status
 */
router.get('/queue', authMiddleware, requireRole('queue:read'), async (req, res) => {
  try {
    const state = req.app.get('state');
    const queue = Array.from(state.customerSockets.values()).map(socket => ({
      id: socket.id,
      name: socket.data?.name || 'Unknown',
      joinedAt: socket.data?.joinedAt || Date.now(),
    }));

    res.json({
      queue,
      count: queue.length,
      status: state.channelStatus,
    });
  } catch (err) {
    logger.error('Queue status error', { error: err.message, correlationId: req.id });
    res.status(500).json({
      code: 'SERVER_500',
      message: 'Failed to get queue status',
      correlationId: req.id,
    });
  }
});

/**
 * POST /v1/admin/queue/pop
 * Take next customer from queue
 */
router.post(
  '/queue/pop',
  authMiddleware,
  requireRole('queue:pop'),
  idempotencyMiddleware,
  async (req, res) => {
    try {
      const state = req.app.get('state');
      const io = req.app.get('io');

      if (state.customerSockets.size === 0) {
        return res.status(404).json({
          code: 'QUEUE_404',
          message: 'Queue is empty',
          correlationId: req.id,
        });
      }

      // Get first customer (FIFO)
      const [customerId, customerSocket] = state.customerSockets.entries().next().value;

      // Notify customer
      io.to(customerId).emit('admin-ready', {
        adminId: req.user.id,
      });

      logger.info('Customer popped from queue', {
        customerId,
        adminId: req.user.id,
        correlationId: req.id,
      });

      res.json({
        customer: {
          id: customerId,
          name: customerSocket.data?.name || 'Unknown',
        },
      });
    } catch (err) {
      logger.error('Queue pop error', { error: err.message, correlationId: req.id });
      res.status(500).json({
        code: 'SERVER_500',
        message: 'Failed to pop from queue',
        correlationId: req.id,
      });
    }
  }
);

/**
 * GET /v1/admin/metrics
 * Get admin metrics (requires metrics:read permission)
 */
router.get('/metrics', authMiddleware, requireRole('metrics:read'), async (req, res) => {
  try {
    const metrics = require('../../utils/metrics');
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  } catch (err) {
    logger.error('Metrics error', { error: err.message, correlationId: req.id });
    res.status(500).json({
      code: 'SERVER_500',
      message: 'Failed to get metrics',
      correlationId: req.id,
    });
  }
});

module.exports = router;
