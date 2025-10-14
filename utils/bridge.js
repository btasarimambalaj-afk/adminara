// Bridge utilities for JWT sync, WebSocket failover, and caching
const logger = require('./logger');
const stateStore = require('./state-store');

// JWT Bridge - Share JWT tokens across instances via Redis
async function syncJWT(token, userId, ttlSeconds = 3600) {
  try {
    await stateStore.set(`jwt:shared:${userId}`, token, ttlSeconds);
    logger.info('JWT synced to Redis', { userId, ttl: ttlSeconds });
    return true;
  } catch (err) {
    logger.error('JWT sync failed', { error: err.message });
    return false;
  }
}

async function getSharedJWT(userId) {
  try {
    const data = await stateStore.get(`jwt:shared:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('JWT retrieval failed', { error: err.message });
    return null;
  }
}

// WebSocket Failover - Transfer state between socket IDs
async function failoverWebSocket(oldSocketId, newSocketId, state) {
  try {
    logger.info('WebSocket failover initiated', { oldSocketId, newSocketId });
    
    // Transfer customer socket state
    const customerData = state.customerSockets.get(oldSocketId);
    if (customerData) {
      state.customerSockets.delete(oldSocketId);
      state.customerSockets.set(newSocketId, customerData);
      
      // Update Redis state
      await stateStore.removeCustomerSocket(oldSocketId);
      await stateStore.addCustomerSocket(newSocketId, {
        customerName: customerData.customerName,
        joinedAt: Date.now()
      });
      
      logger.info('Customer state transferred', { oldSocketId, newSocketId });
      return true;
    }
    
    // Transfer admin socket state
    if (state.adminSocket?.id === oldSocketId) {
      state.adminSocket.id = newSocketId;
      await stateStore.setAdminSocket(newSocketId);
      logger.info('Admin state transferred', { oldSocketId, newSocketId });
      return true;
    }
    
    return false;
  } catch (err) {
    logger.error('WebSocket failover failed', { error: err.message });
    return false;
  }
}

// Caching Layer - Redis TTL sync with invalidation
async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    await stateStore.set(`cache:${key}`, value, ttlSeconds);
    logger.debug('Cache set', { key, ttl: ttlSeconds });
    return true;
  } catch (err) {
    logger.error('Cache set failed', { error: err.message });
    return false;
  }
}

async function cacheGet(key) {
  try {
    const data = await stateStore.get(`cache:${key}`);
    if (data) {
      logger.debug('Cache hit', { key });
      return JSON.parse(data);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (err) {
    logger.error('Cache get failed', { error: err.message });
    return null;
  }
}

async function cacheInvalidate(pattern) {
  try {
    await stateStore.del(`cache:${pattern}`);
    logger.info('Cache invalidated', { pattern });
    return true;
  } catch (err) {
    logger.error('Cache invalidation failed', { error: err.message });
    return false;
  }
}

// Pub/Sub for cache invalidation events
class CacheInvalidationBus {
  constructor(redisClient) {
    this.client = redisClient;
    this.subscribers = new Map();
  }
  
  async publish(event, data) {
    try {
      const message = JSON.stringify({ event, data, timestamp: Date.now() });
      await this.client.publish('cache:invalidation', message);
      logger.debug('Cache invalidation published', { event });
    } catch (err) {
      logger.error('Pub/sub publish failed', { error: err.message });
    }
  }
  
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
  }
  
  async handleMessage(message) {
    try {
      const { event, data } = JSON.parse(message);
      const callbacks = this.subscribers.get(event) || [];
      callbacks.forEach(cb => cb(data));
    } catch (err) {
      logger.error('Pub/sub message handling failed', { error: err.message });
    }
  }
}

module.exports = {
  syncJWT,
  getSharedJWT,
  failoverWebSocket,
  cacheSet,
  cacheGet,
  cacheInvalidate,
  CacheInvalidationBus
};
