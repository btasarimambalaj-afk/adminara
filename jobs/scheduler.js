const logger = require('../utils/logger');
const { traceAsync } = require('../utils/observability');

// Import all job modules
const turnRotation = require('./turn-rotation');
const sessionCleanup = require('./session-cleanup');
const retention = require('./retention');
const telegram = require('./telegram');

/**
 * Initialize all scheduled jobs
 */
const initScheduler = traceAsync('scheduler.init', async function() {
  try {
    logger.info('Initializing job scheduler...');
    
    if (!process.env.REDIS_URL) {
      logger.info('Job scheduler disabled - Redis not configured');
      return {};
    }
    
    // Schedule TURN rotation (weekly)
    await turnRotation.scheduleTurnRotation();
    
    // Schedule session cleanup (hourly)
    await sessionCleanup.scheduleSessionCleanup();
    
    // Schedule retention jobs (daily/weekly)
    await retention.scheduleRetention();
    
    // Initialize Telegram queue
    telegram.init();
    
    logger.info('Job scheduler initialized successfully');
    
    return {
      turnRotation: turnRotation.turnRotationQueue,
      sessionCleanup: sessionCleanup.sessionCleanupQueue,
      retention: retention.retentionQueue,
      telegram: telegram.queue
    };
  } catch (err) {
    logger.error('Job scheduler initialization failed', { error: err.message });
    logger.warn('Continuing without job scheduler');
    return {};
  }
});

/**
 * Graceful shutdown of all workers
 */
async function shutdownScheduler() {
  try {
    if (!process.env.REDIS_URL) {
      logger.info('Job scheduler not running - skipping shutdown');
      return;
    }
    
    logger.info('Shutting down job scheduler...');
    
    const closePromises = [];
    
    if (turnRotation.turnRotationWorker) {
      closePromises.push(turnRotation.turnRotationWorker.close());
    }
    if (sessionCleanup.sessionCleanupWorker) {
      closePromises.push(sessionCleanup.sessionCleanupWorker.close());
    }
    if (retention.retentionWorker) {
      closePromises.push(retention.retentionWorker.close());
    }
    
    await Promise.all(closePromises);
    
    logger.info('Job scheduler shut down successfully');
  } catch (err) {
    logger.error('Job scheduler shutdown failed', { error: err.message });
  }
}

module.exports = {
  initScheduler,
  shutdownScheduler
};
