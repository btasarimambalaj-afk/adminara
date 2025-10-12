const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const bot = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'demo-token'
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

async function sendMessage(chatId, text) {
  if (!bot) {
    logger.warn('Telegram bot not configured');
    return null;
  }
  
  try {
    return await bot.sendMessage(chatId, text);
  } catch (err) {
    logger.error('Telegram send failed', { err: err.message });
    throw err;
  }
}

module.exports = { sendMessage, bot };
