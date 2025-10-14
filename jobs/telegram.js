const { Queue, Worker } = require('bullmq');
const logger = require('../utils/logger');

let queue = null;
let worker = null;

function init() {
  if (!process.env.REDIS_URL) {
    logger.info('Telegram queue disabled - Redis not configured');
    return;
  }

  const connection = { url: process.env.REDIS_URL };

  queue = new Queue('telegramNotifications', { connection });

  worker = new Worker('telegramNotifications', async (job) => {
    const bot = require('../utils/telegram-bot');
    await bot.sendMessage(job.data.chatId, job.data.text);
    logger.info('Telegram message sent', { jobId: job.id });
  }, {
    connection,
    limiter: { max: 5, duration: 1000 },
  });

  worker.on('failed', (job, err) => {
    logger.error('Telegram job failed', { jobId: job?.id, err: err.message });
    if (job && job.attemptsMade >= (job.opts?.attempts || 5)) {
      triggerFallbackNotification(job.data);
    }
  });

  logger.info('Telegram queue initialized');
}

async function enqueueTelegramMessage(payload) {
  if (!queue) {
    const bot = require('../utils/telegram-bot');
    return bot.sendMessage(payload.chatId, payload.text);
  }

  await queue.add('sendTelegram', payload, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

function triggerFallbackNotification(data) {
  logger.error('Telegram fallback triggered', { chatId: data.chatId });
}

async function isHealthy() {
  if (!queue) return true; // No queue = healthy (fallback mode)
  try {
    await queue.client.ping();
    return true;
  } catch (err) {
    logger.warn('Queue health check failed', { error: err.message });
    return false;
  }
}

async function close() {
  if (worker) await worker.close();
  if (queue) await queue.close();
  logger.info('Telegram queue closed');
}

module.exports = {
  init,
  enqueueTelegramMessage,
  isHealthy,
  close,
};
