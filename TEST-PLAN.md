# Test Suite Detaylı Plan

## Dosya Bazlı Test Kategorileri

### 1. Server-Side Tests (server.js)
- Server başlatma
- Port dinleme
- Graceful shutdown
- Environment variables
- Middleware yükleme

### 2. Config Tests (config/index.js)
- Environment validation
- Default values
- TURN configuration
- Redis configuration
- Security settings

### 3. Socket Tests (socket/handlers.js, socket/admin-auth.js)
- Room join/leave
- WebRTC signaling
- ICE candidates
- OTP generation
- Admin authentication
- Session validation

### 4. Routes Tests (routes/index.js)
- /health endpoint
- /config/ice-servers
- /metrics endpoint
- /admin/* routes

### 5. Utils Tests
- admin-session.js: Session CRUD
- error-handler.js: Error handling
- logger.js: Log creation
- metrics.js: Prometheus metrics
- middleware.js: CSRF, timeout
- origin-guard.js: CORS, metrics guard
- rate-limiter.js: Rate limiting
- sentry.js: Error tracking
- state-store.js: Redis operations
- telegram-bot.js: Telegram API
- turn-credentials.js: TURN generation
- validation.js: Joi schemas

### 6. Frontend Tests
- index.html: Customer UI
- admin.html: Admin UI
- client.js: Customer logic
- admin-app.js: Admin logic
- webrtc.js: WebRTC manager
- perfect-negotiation.js: Negotiation
- helpers.js: Shared utilities
- toast.js: Notifications
- queue-ui.js: Queue display

### 7. Integration Tests
- Customer → Socket → Admin flow
- WebRTC connection establishment
- Reconnection scenarios
- Queue system
- OTP flow

### 8. Performance Tests
- Memory leaks
- Connection limits
- Concurrent users
- Bandwidth usage

### 9. Security Tests
- CSP compliance
- CORS policy
- Rate limiting
- OTP lockout
- Session hijacking

### 10. E2E Tests
- Full customer journey
- Full admin journey
- Multi-user scenarios
