const express = require('express');
const { celebrate, Joi } = require('celebrate');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * POST /v1/customer/join-queue
 * Join the support queue
 */
router.post(
  '/join-queue',
  celebrate({
    body: Joi.object({
      name: Joi.string().trim().min(2).max(50).required(),
    }),
  }),
  async (req, res) => {
    try {
      const { name } = req.body;
      const state = req.app.get('state');

      // Get queue position
      const position = state.customerSockets.size + 1;

      logger.info('Customer joined queue', {
        name,
        position,
        correlationId: req.id,
      });

      res.json({
        position,
        estimatedWait: position * 60, // 1 min per customer
        message: 'Kuyruğa eklendi',
      });
    } catch (err) {
      logger.error('Join queue error', { error: err.message, correlationId: req.id });
      res.status(500).json({
        code: 'SERVER_500',
        message: 'Failed to join queue',
        correlationId: req.id,
      });
    }
  }
);

/**
 * GET /v1/customer/queue-status
 * Get current queue position
 */
router.get('/queue-status', async (req, res) => {
  try {
    const state = req.app.get('state');

    res.json({
      queueLength: state.customerSockets.size,
      channelStatus: state.channelStatus,
      estimatedWait: state.customerSockets.size * 60,
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

module.exports = router;
