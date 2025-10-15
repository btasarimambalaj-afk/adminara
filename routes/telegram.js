const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { bot } = require('../utils/telegram-bot');

/**
 * POST /api/telegram/send
 * Backend proxy for Telegram notifications
 */
router.post('/send', async (req, res) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid text parameter' });
  }
  
  if (!bot) {
    logger.warn('Telegram bot not configured');
    return res.status(503).json({ error: 'Telegram not configured' });
  }
  
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) {
    logger.warn('TELEGRAM_ADMIN_CHAT_ID not set');
    return res.status(503).json({ error: 'Telegram chat ID not configured' });
  }
  
  try {
    await bot.sendMessage(chatId, text);
    logger.info('Telegram notification sent', { length: text.length });
    res.sendStatus(204);
  } catch (error) {
    logger.error('Telegram send failed', { error: error.message });
    res.status(500).json({ error: 'Failed to send Telegram message' });
  }
});

module.exports = router;
