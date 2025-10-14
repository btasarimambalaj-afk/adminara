const { Queue, Worker } = require('bullmq');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

const connection = config.REDIS_URL ? {
  host: new URL(config.REDIS_URL).hostname,
  port: new URL(config.REDIS_URL).port
} : undefined;

// Queue for TURN secret rotation
const turnRotationQueue = new Queue('turn-rotation', { connection });

/**
 * Rotate TURN secret
 * Generates new secret and updates config
 */
async function rotateTurnSecret() {
  try {
    const newSecret = crypto.randomBytes(32).toString('hex');
    
    // In production, update secret in KMS/Vault
    // For now, log the rotation
    logger.info('TURN secret rotated', { 
      secretLength: newSecret.length,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Update KMS/Vault with new secret
    // await kms.updateSecret('TURN_SECRET', newSecret);
    
    // Invalidate old credentials cache
    const turnCredentials = require('../utils/turn-credentials');
    if (turnCredentials.cachedCredentials) {
      turnCredentials.cachedCredentials = null;
      turnCredentials.cacheExpiry = 0;
    }
    
    return { success: true, rotatedAt: Date.now() };
  } catch (err) {
    logger.error('TURN rotation failed', { error: err.message });
    throw err;
  }
}

// Worker to process rotation jobs
const turnRotationWorker = new Worker('turn-rotation', async (job) => {
  logger.info('Processing TURN rotation job', { jobId: job.id });
  return await rotateTurnSecret();
}, { connection });

turnRotationWorker.on('completed', (job) => {
  logger.info('TURN rotation completed', { jobId: job.id });
});

turnRotationWorker.on('failed', (job, err) => {
  logger.error('TURN rotation failed', { jobId: job?.id, error: err.message });
});

/**
 * Schedule weekly TURN rotation
 * Runs every Sunday at 00:00
 */
async function scheduleTurnRotation() {
  if (!connection) {
    logger.warn('Redis not configured, skipping TURN rotation schedule');
    return;
  }
  
  await turnRotationQueue.add(
    'rotate-turn-secret',
    {},
    {
      repeat: {
        pattern: '0 0 * * 0' // Every Sunday at 00:00
      },
      removeOnComplete: 10,
      removeOnFail: 50
    }
  );
  
  logger.info('TURN rotation scheduled (weekly, Sunday 00:00)');
}

module.exports = {
  turnRotationQueue,
  turnRotationWorker,
  scheduleTurnRotation,
  rotateTurnSecret
};
