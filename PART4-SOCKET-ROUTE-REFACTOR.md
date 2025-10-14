# PART 4: Socket ve Route Refactor

## Değişiklik Özeti

✅ routes/middleware/auth.js (JWT verification + revocation check)
✅ routes/middleware/rbac.js (Role-based access control)
✅ routes/middleware/correlation.js (X-Request-ID generation)
✅ routes/middleware/idempotency.js (Duplicate request prevention)
✅ routes/v1/admin.js (Admin API endpoints)
✅ routes/v1/customer.js (Customer API endpoints)
✅ socket/schema-validator.js (WebRTC message validation)
✅ utils/state-store.js (JWT revocation functions)
✅ server.js (V1 routes integration)
✅ package.json (js-yaml dependency)

## Yeni API Endpoints

### Admin Endpoints (Requires Auth + RBAC)

```
GET  /v1/admin/queue          # Get queue status (queue:read)
POST /v1/admin/queue/pop      # Pop next customer (queue:pop)
GET  /v1/admin/metrics         # Get metrics (metrics:read)
```

### Customer Endpoints (Public)

```
POST /v1/customer/join-queue   # Join support queue
GET  /v1/customer/queue-status # Get queue status
```

## Middleware Chain

```
Request
  ↓
correlationMiddleware (X-Request-ID)
  ↓
authMiddleware (JWT verify + revocation check)
  ↓
requireRole('permission') (RBAC check)
  ↓
idempotencyMiddleware (Duplicate prevention)
  ↓
Handler
```

## JWT Authentication Flow

```javascript
// 1. Extract token
const token = req.headers.authorization?.replace('Bearer ', '');

// 2. Verify JWT
const decoded = jwt.verify(token, config.JWT_SECRET);

// 3. Check revocation
const isRevoked = await stateStore.isJtiRevoked(decoded.jti);

// 4. Attach user
req.user = { id: decoded.sub, role: decoded.role, jti: decoded.jti };
```

## RBAC Permission Check

```javascript
// config/roles.yaml
roles:
  admin: [queue:read, queue:pop, metrics:read]
  operator: [queue:read, queue:pop]
  viewer: [queue:read]

// Usage
router.post('/queue/pop', 
  authMiddleware,
  requireRole('queue:pop'),  // Only admin/operator
  handler
);
```

## Idempotency

```javascript
// Client sends
POST /v1/admin/queue/pop
Idempotency-Key: uuid-123

// First request → Process
// Second request → Return cached response (24h)
```

## Socket Message Validation

```javascript
// socket/schema-validator.js
const schemas = {
  offer: Joi.object({
    type: Joi.string().valid('offer').required(),
    sdp: Joi.string().required()
  }),
  iceCandidate: Joi.object({
    candidate: Joi.string().required(),
    sdpMid: Joi.string().allow(null),
    sdpMLineIndex: Joi.number().allow(null)
  })
};

// Usage in socket handlers
socket.on('offer', validateSocket('offer'), (data) => {
  // data is validated
});
```

## Error Response Format

```json
{
  "code": "AUTH_401",
  "message": "Token expired",
  "correlationId": "uuid-123"
}
```

## State Store Extensions

```javascript
// JWT Revocation
await stateStore.revokeJti(jti, 86400); // 24h TTL
const isRevoked = await stateStore.isJtiRevoked(jti);

// Generic set/get
await stateStore.set('key', { data }, 3600); // 1h TTL
const value = await stateStore.get('key');
```

## Testing

```bash
# Install dependencies
npm install

# Test auth middleware
npm test tests/unit/auth-middleware.test.js

# Test RBAC
npm test tests/unit/rbac.test.js

# Test v1 routes
npm test tests/integration/v1-routes.test.js
```

## Usage Examples

### Admin: Get Queue

```bash
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/v1/admin/queue
```

Response:
```json
{
  "queue": [
    { "id": "socket-123", "name": "Customer 1", "joinedAt": 1234567890 }
  ],
  "count": 1,
  "status": "AVAILABLE"
}
```

### Admin: Pop Queue

```bash
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Idempotency-Key: uuid-123" \
  http://localhost:3000/v1/admin/queue/pop
```

Response:
```json
{
  "customer": {
    "id": "socket-123",
    "name": "Customer 1"
  }
}
```

### Customer: Join Queue

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}' \
  http://localhost:3000/v1/customer/join-queue
```

Response:
```json
{
  "position": 3,
  "estimatedWait": 180,
  "message": "Kuyruğa eklendi"
}
```

## Security Improvements

| Feature | Old | New | Benefit |
|---------|-----|-----|---------|
| Auth | OTP only | JWT + Revocation | Stateless + secure logout |
| Authorization | None | RBAC (4 roles) | Least privilege |
| Request tracking | None | X-Request-ID | Debug/trace |
| Duplicate prevention | None | Idempotency-Key | Data integrity |
| Message validation | None | JSON Schema | Input sanitization |

## Next Steps

- ✅ Part 4 completed
- ⏭️ Part 5: Utils modülleri (auth.js with MFA)
- ⏭️ Part 6: WebRTC optimizations
- ⏭️ Part 16: MFA implementation
- ⏭️ Part 17: TURN rotation job

---

**Hazırlayan:** Amazon Q  
**Tarih:** 2024  
**Versiyon:** 1.0
