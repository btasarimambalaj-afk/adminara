// routes/health-detailed.js - Detailed Health Check Endpoint

const express = require('express');
const router = express.Router();
const stateStore = require('../utils/state-store');
const logger = require('../utils/logger');

// Health check for Redis
async function checkRedis() {
  try {
    const start = Date.now();
    const healthy = await stateStore.isHealthy();
    const latency = Date.now() - start;
    
    if (!healthy) {
      return { healthy: false, message: 'Using in-memory fallback' };
    }
    
    return {
      healthy: latency < 100,
      latency: `${latency}ms`,
      status: latency < 100 ? 'healthy' : 'degraded'
    };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

// Health check for Socket.IO
function checkSocketIO() {
  try {
    const io = global.io;
    if (!io) {
      return { healthy: false, message: 'Socket.IO not initialized' };
    }
    
    const sockets = io.sockets.sockets.size;
    return {
      healthy: true,
      connections: sockets,
      status: sockets < 100 ? 'healthy' : 'degraded'
    };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

// Health check for memory
function checkMemory() {
  try {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const percentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);
    
    return {
      healthy: percentage < 90,
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      percentage: `${percentage}%`,
      status: percentage < 80 ? 'healthy' : percentage < 90 ? 'degraded' : 'critical'
    };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

// Health check for uptime
function checkUptime() {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  return {
    healthy: true,
    uptime: `${hours}h ${minutes}m`,
    seconds: uptimeSeconds
  };
}

// Detailed health check endpoint
router.get('/health/detailed', async (req, res) => {
  try {
    const checks = {
      redis: await checkRedis(),
      socketio: checkSocketIO(),
      memory: checkMemory(),
      uptime: checkUptime()
    };

    // Determine overall status
    const allHealthy = Object.values(checks).every(c => c.healthy !== false);
    const anyDegraded = Object.values(checks).some(c => c.status === 'degraded');
    
    const overallStatus = allHealthy 
      ? (anyDegraded ? 'degraded' : 'healthy')
      : 'unhealthy';

    const statusCode = overallStatus === 'healthy' ? 200 : 
                       overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.3.8',
      environment: process.env.NODE_ENV || 'development',
      checks
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
