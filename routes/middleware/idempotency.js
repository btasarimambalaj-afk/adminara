const stateStore = require('../../utils/state-store');
const logger = require('../../utils/logger');

/**
 * Idempotency Middleware
 * Prevents duplicate POST/PUT/PATCH requests using Idempotency-Key header
 */
async function idempotencyMiddleware(req, res, next) {
  // Only for write operations
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }
  
  const key = req.headers['idempotency-key'];
  if (!key) {
    return next(); // Optional, not enforced
  }
  
  try {
    const cacheKey = `idemp:${key}`;
    
    // Check if request already processed
    const cached = await stateStore.get(cacheKey);
    if (cached) {
      logger.info('Idempotent request detected', { 
        key, 
        method: req.method, 
        path: req.path,
        correlationId: req.id
      });
      
      return res.status(cached.status).json(cached.body);
    }
    
    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = function(body) {
      // Cache successful responses for 24 hours
      if (res.statusCode >= 200 && res.statusCode < 300) {
        stateStore.set(cacheKey, { 
          status: res.statusCode, 
          body 
        }, 86400).catch(err => {
          logger.error('Failed to cache idempotent response', { error: err.message });
        });
      }
      return originalJson(body);
    };
    
    next();
  } catch (err) {
    logger.error('Idempotency middleware error', { error: err.message });
    next(); // Continue without idempotency on error
  }
}

module.exports = { idempotencyMiddleware };
