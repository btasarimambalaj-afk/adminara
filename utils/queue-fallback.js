const logger = require('./logger');

/**
 * In-Memory Queue Fallback (Redis olmadan)
 * Simple FIFO queue using Array
 */
class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.queue = [];
    this.processing = false;
    logger.info('In-memory queue initialized', { name });
  }

  async add(jobName, data, options = {}) {
    const job = {
      id: Date.now() + Math.random(),
      name: jobName,
      data,
      options,
      attempts: 0,
      maxAttempts: options.attempts || 3,
      addedAt: Date.now(),
    };

    this.queue.push(job);
    logger.debug('Job added to in-memory queue', {
      jobId: job.id,
      queueLength: this.queue.length,
    });

    // Auto-process if not already processing
    if (!this.processing) {
      setImmediate(() => this.process());
    }

    return job;
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      try {
        await this.executeJob(job);
        logger.debug('Job completed', { jobId: job.id });
      } catch (err) {
        job.attempts++;

        if (job.attempts < job.maxAttempts) {
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, job.attempts), 30000);
          logger.warn('Job failed, retrying', {
            jobId: job.id,
            attempt: job.attempts,
            delay,
          });

          setTimeout(() => {
            this.queue.push(job);
            this.process();
          }, delay);
        } else {
          logger.error('Job failed permanently', {
            jobId: job.id,
            error: err.message,
          });
        }
      }
    }

    this.processing = false;
  }

  async executeJob(job) {
    // Override this method in subclass
    throw new Error('executeJob must be implemented');
  }

  async count() {
    return this.queue.length;
  }

  async close() {
    this.queue = [];
    this.processing = false;
    logger.info('In-memory queue closed', { name: this.name });
  }

  async isHealthy() {
    return true; // Always healthy
  }
}

/**
 * Customer Queue (for waiting customers)
 */
class CustomerQueue extends InMemoryQueue {
  constructor() {
    super('customerQueue');
    this.customers = [];
  }

  async enqueue(socketId, data) {
    this.customers.push({ socketId, data, joinedAt: Date.now() });
    logger.info('Customer enqueued', { socketId, position: this.customers.length });
    return this.customers.length;
  }

  async dequeue() {
    if (this.customers.length === 0) return null;
    const customer = this.customers.shift();
    logger.info('Customer dequeued', { socketId: customer.socketId });
    return customer;
  }

  async length() {
    return this.customers.length;
  }

  async clear() {
    this.customers = [];
  }
}

module.exports = {
  InMemoryQueue,
  CustomerQueue,
};
