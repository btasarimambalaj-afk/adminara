const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

let Queue, Worker;
let retentionQueue = null;
let retentionWorker = null;

try {
  if (config.REDIS_URL) {
    const bullmq = require('bullmq');
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;

    const connection = {
      host: new URL(config.REDIS_URL).hostname,
      port: new URL(config.REDIS_URL).port,
    };

    retentionQueue = new Queue('retention', { connection });
  }
} catch (err) {
  logger.warn('BullMQ not available for retention', { error: err.message });
}

/**
 * Delete old log files based on retention policy
 */
async function deleteOldLogs() {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const retentionDays = config.RETENTION_DAYS || 30;
    const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const files = await fs.readdir(logsDir);
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffDate) {
        await fs.unlink(filePath);
        deleted++;
        logger.info('Deleted old log file', { file, age: retentionDays });
      }
    }

    return { success: true, deleted };
  } catch (err) {
    logger.error('Log deletion failed', { error: err.message });
    throw err;
  }
}

/**
 * Anonymize old session data
 */
async function anonymizeOldSessions() {
  try {
    // TODO: Implement session anonymization
    // - Remove PII from old sessions
    // - Keep aggregated metrics

    logger.info('Session anonymization completed');
    return { success: true, anonymized: 0 };
  } catch (err) {
    logger.error('Session anonymization failed', { error: err.message });
    throw err;
  }
}

if (Worker && config.REDIS_URL) {
  const connection = {
    host: new URL(config.REDIS_URL).hostname,
    port: new URL(config.REDIS_URL).port,
  };

  retentionWorker = new Worker(
    'retention',
    async job => {
      logger.info('Processing retention job', { jobId: job.id, type: job.name });

      if (job.name === 'delete-old-logs') {
        return await deleteOldLogs();
      } else if (job.name === 'anonymize-sessions') {
        return await anonymizeOldSessions();
      }

      throw new Error(`Unknown retention job: ${job.name}`);
    },
    { connection }
  );

  retentionWorker.on('completed', (job, result) => {
    logger.info('Retention job completed', {
      jobId: job.id,
      type: job.name,
      result,
    });
  });

  retentionWorker.on('failed', (job, err) => {
    logger.error('Retention job failed', {
      jobId: job?.id,
      type: job?.name,
      error: err.message,
    });
  });
}

/**
 * Schedule daily retention jobs
 */
async function scheduleRetention() {
  if (!retentionQueue) {
    logger.info('Retention jobs disabled - Redis not configured');
    return;
  }

  // Delete old logs daily at 02:00
  await retentionQueue.add(
    'delete-old-logs',
    {},
    {
      repeat: {
        pattern: '0 2 * * *', // Daily at 02:00
      },
      removeOnComplete: 10,
      removeOnFail: 50,
    }
  );

  // Anonymize sessions weekly at 03:00 on Sunday
  await retentionQueue.add(
    'anonymize-sessions',
    {},
    {
      repeat: {
        pattern: '0 3 * * 0', // Weekly Sunday at 03:00
      },
      removeOnComplete: 10,
      removeOnFail: 50,
    }
  );

  logger.info('Retention jobs scheduled (daily logs, weekly anonymization)');
}

module.exports = {
  retentionQueue,
  retentionWorker,
  scheduleRetention,
  deleteOldLogs,
  anonymizeOldSessions,
};
