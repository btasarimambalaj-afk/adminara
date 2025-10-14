const config = require('../config');
const logger = require('../utils/logger');
const adminSession = require('../utils/admin-session');

let Queue, Worker;
let sessionCleanupQueue = null;
let sessionCleanupWorker = null;

try {
  if (config.REDIS_URL) {
    const bullmq = require('bullmq');
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;
    
    const connection = {
      host: new URL(config.REDIS_URL).hostname,
      port: new URL(config.REDIS_URL).port
    };
    
    sessionCleanupQueue = new Queue('session-cleanup', { connection });
  }
} catch (err) {
  logger.warn('BullMQ not available for session cleanup', { error: err.message });
}

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

if (Worker && config.REDIS_URL) {
  const connection = {
    host: new URL(config.REDIS_URL).hostname,
    port: new URL(config.REDIS_URL).port
  };
  
  sessionCleanupWorker = new Worker('session-cleanup', async (job) => {
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
}

/**
 * Schedule hourly session cleanup
 */
async function scheduleSessionCleanup() {
  if (!sessionCleanupQueue) {
    logger.info('Session cleanup disabled - Redis not configured');
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
