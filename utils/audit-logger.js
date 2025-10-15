// utils/audit-logger.js - Audit Logging for Compliance

const logger = require('./logger');
const redis = require('./redis');

class AuditLogger {
  constructor() {
    this.namespace = 'audit';
  }

  async log(event) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...event
    };

    // Log to Winston
    logger.info('AUDIT', auditEntry);

    // Store in Redis for quick access (30 days TTL)
    if (redis.client) {
      try {
        const key = `${this.namespace}:${auditEntry.eventId}`;
        await redis.client.setEx(key, 2592000, JSON.stringify(auditEntry));
        
        // Add to sorted set for time-based queries
        await redis.client.zAdd(`${this.namespace}:timeline`, {
          score: Date.now(),
          value: auditEntry.eventId
        });
      } catch (error) {
        logger.error('Audit log Redis storage failed:', error);
      }
    }

    return auditEntry.eventId;
  }

  async logUserAction(userId, action, details = {}) {
    return this.log({
      type: 'USER_ACTION',
      userId,
      action,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    });
  }

  async logDataAccess(userId, dataType, recordId) {
    return this.log({
      type: 'DATA_ACCESS',
      userId,
      dataType,
      recordId,
      action: 'READ'
    });
  }

  async logDataModification(userId, dataType, recordId, changes) {
    return this.log({
      type: 'DATA_MODIFICATION',
      userId,
      dataType,
      recordId,
      changes,
      action: 'UPDATE'
    });
  }

  async logDataDeletion(userId, dataType, recordId, reason) {
    return this.log({
      type: 'DATA_DELETION',
      userId,
      dataType,
      recordId,
      reason,
      action: 'DELETE'
    });
  }

  async logSecurityEvent(eventType, details) {
    return this.log({
      type: 'SECURITY_EVENT',
      eventType,
      details,
      severity: details.severity || 'medium'
    });
  }

  async logAdminAction(adminId, action, target, details = {}) {
    return this.log({
      type: 'ADMIN_ACTION',
      adminId,
      action,
      target,
      details
    });
  }

  async getAuditTrail(userId, startDate, endDate) {
    if (!redis.client) {
      return { error: 'Redis not available' };
    }

    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      const eventIds = await redis.client.zRangeByScore(
        `${this.namespace}:timeline`,
        start,
        end
      );

      const events = await Promise.all(
        eventIds.map(async (id) => {
          const data = await redis.client.get(`${this.namespace}:${id}`);
          return data ? JSON.parse(data) : null;
        })
      );

      return events.filter(e => e && e.userId === userId);
    } catch (error) {
      logger.error('Audit trail retrieval failed:', error);
      return { error: error.message };
    }
  }
}

module.exports = new AuditLogger();
