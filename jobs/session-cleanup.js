const { Queue, Worker } = require('bullmq');
const config = require('../config');
const logger = require('../utils/logger');
const adminSession = require('../utils/admin-session');

const connection = config.REDIS_URL ? {
  host: new URL(config.REDIS_URL).hostname,
  port: new URL(config.REDIS_URL).port
} : undefined;

const sessionCleanupQueue = new Queue('session-cleanup', { connection });

/**
 * Cleanup expired sessions
 */
async function cleanupExpiredSessions() {
  try {
    const cleaned = await adminSession.cleanupExpiredSessions();
    logger.info('Session cleanup completed', { cleaned });
    return { success: true, cleaned };
  } catch (err) {
    logger.error('Session cleanup failed', { error: err.message });
    throw err;
  }
}

const sessionCleanupWorker = new Worker('session-cleanup', async (job) => {
  logger.info('Processing session cleanup job', { jobId: job.id });
  return await cleanupExpiredSessions();
}, { connection });

sessionCleanupWorker.on('completed', (job, result) => {
  logger.info('Session cleanup completed', { 
    jobId: job.id, 
    cleaned: result.cleaned 
  });
});

sessionCleanupWorker.on('failed', (job, err) => {
  logger.error('Session cleanup failed', { 
    jobId: job?.id, 
    error: err.message 
  });
});

/**
 * Schedule hourly session cleanup
 */
async function scheduleSessionCleanup() {
  if (!connection) {
    logger.warn('Redis not configured, skipping session cleanup schedule');
    return;
  }
  
  await sessionCleanupQueue.add(
    'cleanup-sessions',
    {},
    {
      repeat: {
        pattern: '0 * * * *' // Every hour
      },
      removeOnComplete: 10,
      removeOnFail: 50
    }
  );
  
  logger.info('Session cleanup scheduled (hourly)');
}

module.exports = {
  sessionCleanupQueue,
  sessionCleanupWorker,
  scheduleSessionCleanup,
  cleanupExpiredSessions
};
