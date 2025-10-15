# AdminAra - Integration Guide

## 🔧 How to Integrate New Features

This guide shows how to integrate the newly created utilities and middleware.

---

## 1. Rate Limiting Integration

### server.js
```javascript
const { rateLimiters } = require('./middleware/rate-limit-enhanced');

// Apply global rate limiting
app.use(rateLimiters.global);
```

### routes/v1/admin.js
```javascript
const { rateLimiters } = require('../../middleware/rate-limit-enhanced');

// Apply admin-specific rate limiting
router.use(rateLimiters.admin);
```

### routes/v1/customer.js
```javascript
const { rateLimiters } = require('../../middleware/rate-limit-enhanced');

// Apply customer-specific rate limiting
router.use(rateLimiters.customer);
```

### socket/index.js
```javascript
const { socketRateLimit } = require('../middleware/rate-limit-enhanced');

// Apply per-event rate limiting
io.on('connection', (socket) => {
  socket.use((packet, next) => {
    const [eventName] = packet;
    socketRateLimit(eventName)(socket, next);
  });
});
```

---

## 2. Input Validation Integration

### socket/index.js
```javascript
const { validateSocketEvent } = require('./validation-schemas');

socket.on('rtc:description', (data, callback) => {
  validateSocketEvent('rtc:description')(data, (err, validated) => {
    if (err) {
      return callback({ error: err.message });
    }
    // Process validated data
    handleRTCDescription(validated);
  });
});

socket.on('chat:send', (data, callback) => {
  validateSocketEvent('chat:send')(data, (err, validated) => {
    if (err) {
      return callback({ error: err.message });
    }
    // Process validated message
    handleChatMessage(validated);
  });
});
```

---

## 3. Enhanced Health Checks

### server.js
```javascript
const healthDetailed = require('./routes/health-detailed');

// Mount detailed health check
app.use(healthDetailed);

// Access at: GET /health/detailed
```

---

## 4. Error Handling Integration

### server.js
```javascript
const { AppError, errorHandler } = require('./utils/app-error');

// Use AppError in routes
app.get('/api/example', (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('User not authenticated'));
  }
  // ... rest of logic
});

// Mount error handler (MUST be last middleware)
app.use(errorHandler);
```

### Example Usage
```javascript
// Bad request
throw AppError.badRequest('Invalid input', 'INVALID_INPUT');

// Unauthorized
throw AppError.unauthorized('Invalid token', 'AUTH_INVALID_TOKEN');

// Not found
throw AppError.notFound('User not found', 'USER_NOT_FOUND');

// Rate limit
throw AppError.tooManyRequests('Too many requests', 'RATE_LIMIT_EXCEEDED');

// Internal error
throw AppError.internal('Database error', 'DB_ERROR');
```

---

## 5. Audit Logging Integration

### routes/v1/admin.js
```javascript
const auditLogger = require('../../utils/audit-logger');

router.post('/accept-call', async (req, res, next) => {
  try {
    const { customerId } = req.body;
    
    // Log admin action
    await auditLogger.logAdminAction(
      req.user.id,
      'ACCEPT_CALL',
      customerId,
      { ip: req.ip, userAgent: req.get('user-agent') }
    );
    
    // ... rest of logic
  } catch (error) {
    next(error);
  }
});
```

### Example Usage
```javascript
// User action
await auditLogger.logUserAction(userId, 'LOGIN', { ip, userAgent });

// Data access
await auditLogger.logDataAccess(userId, 'CUSTOMER_DATA', customerId);

// Data modification
await auditLogger.logDataModification(userId, 'USER_PROFILE', userId, { name: 'New Name' });

// Data deletion
await auditLogger.logDataDeletion(userId, 'CALL_RECORD', callId, 'User request');

// Security event
await auditLogger.logSecurityEvent('FAILED_LOGIN', { userId, ip, attempts: 3 });

// Get audit trail
const trail = await auditLogger.getAuditTrail(userId, '2024-01-01', '2024-12-31');
```

---

## 6. Feature Flags Integration

### server.js
```javascript
const { isFeatureEnabled } = require('./utils/feature-flags');

if (isFeatureEnabled('ENABLE_QUEUE')) {
  // Initialize queue system
  const queueManager = require('./utils/queue-manager');
  app.use('/api/queue', queueManager.router);
}

if (isFeatureEnabled('ENABLE_CSRF')) {
  // Enable CSRF protection
  app.use(csrf());
}
```

---

## 7. API Versioning Integration

### server.js
```javascript
const { apiVersioning, deprecationWarning } = require('./middleware/api-versioning');

// Apply to all v1 routes
app.use('/v1/*', apiVersioning);

// Mark deprecated endpoint
app.use('/v1/old-endpoint', deprecationWarning('Wed, 01 Jan 2026 00:00:00 GMT'));
```

---

## 🧪 Testing Integration

### Test Rate Limiting
```bash
# Test global rate limit
for i in {1..150}; do curl http://localhost:3000/health; done

# Should return 429 after 100 requests
```

### Test Input Validation
```javascript
// Socket.IO client
socket.emit('chat:send', { message: 'x'.repeat(501) }, (response) => {
  // Should return validation error
  console.log(response.error); // "message length must be less than or equal to 500"
});
```

### Test Health Check
```bash
curl http://localhost:3000/health/detailed

# Response:
{
  "status": "healthy",
  "checks": {
    "redis": { "healthy": true, "latency": "15ms" },
    "socketio": { "healthy": true, "connections": 42 },
    "memory": { "healthy": true, "percentage": "45%" },
    "uptime": { "healthy": true, "uptime": "12h 34m" }
  }
}
```

### Test Error Handling
```javascript
// Should return standardized error
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token",
    "statusCode": 401,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Test Audit Logging
```bash
# Check logs
tail -f logs/combined.log | grep AUDIT

# Check Redis
redis-cli KEYS "audit:*"
redis-cli GET "audit:1234567890-abc123"
```

---

## 📋 Integration Checklist

- [ ] Rate limiting applied to all routes
- [ ] Socket.IO events validated
- [ ] Health check endpoint mounted
- [ ] Error handler as last middleware
- [ ] Audit logging in critical actions
- [ ] Feature flags checked before initialization
- [ ] API versioning headers added
- [ ] All integrations tested
- [ ] Documentation updated
- [ ] Team notified

---

## 🚨 Common Issues

### Rate Limiting Not Working
- Check middleware order (should be early)
- Verify Redis connection for distributed rate limiting
- Check rate limit configuration

### Validation Errors Not Showing
- Ensure validation middleware is before handler
- Check Joi schema syntax
- Verify error callback is called

### Health Check Returns 503
- Check Redis connection
- Verify Socket.IO initialization
- Check memory usage

### Audit Logs Not Saving
- Verify Redis connection
- Check Winston configuration
- Ensure logger is initialized

---

## 📞 Support

For integration help:
- Check logs: `tail -f logs/combined.log`
- Review documentation: `/docs`
- Contact: DevOps team
