# AdminAra - System Overview

**Generated**: 2024
**Version**: 1.3.8
**Status**: Production Ready

---

## 📁 Project Structure

```
AdminAra/
├── config/                    # Configuration
│   ├── index.js              # Main config (envalid)
│   └── roles.yaml            # RBAC roles
├── docs/                      # Documentation
│   ├── diagrams/             # Mermaid diagrams
│   ├── runbook/              # Operational guides
│   ├── API-DEPRECATION-POLICY.md
│   ├── CI-CD.md
│   ├── ENCODING.md
│   ├── I18N.md
│   └── PWA.md
├── jobs/                      # Background jobs
│   ├── scheduler.js          # Job scheduler
│   ├── retention.js          # Data retention
│   ├── session-cleanup.js    # Session cleanup
│   ├── telegram.js           # Telegram notifications
│   └── turn-rotation.js      # TURN credential rotation
├── lib/                       # Libraries
│   ├── testEngine.js         # Test execution engine
│   └── reportUtils.js        # Report generation
├── middleware/                # Express middleware
│   ├── api-versioning.js     # API versioning
│   └── rate-limit-enhanced.js # Rate limiting
├── monitoring/                # Monitoring stack
│   ├── grafana/              # Grafana dashboards
│   ├── prometheus.yml        # Prometheus config
│   └── README.md
├── public/                    # Static files
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side JavaScript
│   ├── locales/              # i18n translations
│   ├── icons/                # PWA icons
│   ├── index.html            # Customer page
│   ├── admin.html            # Admin panel
│   ├── test-suite.html       # Test & diagnostics
│   ├── manifest.json         # PWA manifest
│   └── service-worker.js     # Service worker
├── reports/                   # Test reports (auto-generated)
│   ├── test_report.md        # Main report
│   ├── test_results.json     # JSON results
│   ├── autofix_suggestions.md # Fix suggestions
│   └── akilli-rapor.md       # Smart summary
├── routes/                    # Express routes
│   ├── v1/                   # API v1
│   ├── middleware/           # Route middleware
│   ├── health-detailed.js    # Enhanced health check
│   └── index.js              # Main router
├── scripts/                   # Utility scripts
│   ├── schedule.config.json  # Test scheduling
│   └── apply-improvements.sh # Deployment script
├── socket/                    # Socket.IO
│   ├── handlers.js           # Socket handlers
│   ├── admin-auth.js         # Admin authentication
│   └── validation-schemas.js # Joi schemas
├── tests/                     # Test suites
│   ├── auto-fix/             # Auto-fix system
│   ├── e2e/                  # E2E tests (Playwright)
│   ├── helpers/              # Test helpers
│   ├── integration/          # Integration tests
│   ├── load/                 # Load tests (k6)
│   ├── performance/          # Performance tests
│   └── security/             # Security tests
├── utils/                     # Utilities
│   ├── admin-session.js      # Admin session management
│   ├── app-error.js          # Error handling
│   ├── audit-logger.js       # Audit logging
│   ├── auth.js               # Authentication
│   ├── bridge.js             # Redis bridge
│   ├── encryption.js         # Encryption utilities
│   ├── feature-flags.js      # Feature flags
│   ├── logger.js             # Winston logger
│   ├── metrics.js            # Prometheus metrics
│   ├── observability.js      # OpenTelemetry
│   ├── origin-guard.js       # CORS/Origin validation
│   ├── queue-fallback.js     # In-memory queue
│   ├── rate-limiter.js       # Rate limiting
│   ├── rbac.js               # Role-based access
│   ├── redis.js              # Redis client (optional)
│   ├── sentry.js             # Sentry integration
│   ├── session.js            # Session management
│   ├── socket-rate-limiter.js # Socket rate limiting
│   ├── socket-validator.js   # Socket validation
│   ├── state-store.js        # State management
│   ├── telegram-bot.js       # Telegram bot
│   └── turn-credentials.js   # TURN credentials
├── .github/                   # GitHub
│   ├── workflows/            # CI/CD workflows
│   ├── ISSUE_TEMPLATE/       # Issue templates
│   └── pull_request_template.md
├── server.js                  # Main server
├── package.json              # Dependencies
├── Dockerfile                # Docker image
├── docker-compose.yml        # Docker compose
├── render.yaml               # Render.com config
└── README.md                 # Main documentation
```

---

## 🔗 Page Connections

### Customer Flow
```
index.html (Customer)
  ├── CSS: main.css, hero.css, mobile.css, accessibility.css, toast.css, pwa.css
  ├── JS: socket.io, i18n-helper, toast, offline-handler, warmup, accessibility
  │       perfect-negotiation, connection-monitor, adaptive-quality, helpers
  │       webrtc, queue-ui, client, customer-app, pwa-install
  └── Socket.IO → server.js → socket/handlers.js
```

### Admin Flow
```
admin.html (Admin Panel)
  ├── CSS: main.css, hero.css, admin.css, mobile.css, accessibility.css, toast.css
  ├── JS: socket.io, toast, offline-handler, warmup, accessibility
  │       perfect-negotiation, connection-monitor, adaptive-quality, helpers
  │       webrtc, admin-app
  ├── Auth: OTP → /admin/otp/request → /admin/otp/verify
  └── Socket.IO → server.js → socket/admin-auth.js
```

### Test Suite Flow
```
test-suite.html (Test & Diagnostics)
  ├── CSS: test-suite.css
  ├── JS: socket.io, test-ai-analyzer, test-snapshot, test-exporter
  │       test-diagnostics, test-repair, tests
  ├── Features: AI Analysis, Snapshot/Rollback, Export (MD/CSV/JSON/ZIP)
  └── Socket.IO → server.js (test connections)
```

---

## 🔌 External Integrations

### 1. Telegram Bot (Optional)
- **Purpose**: OTP delivery, notifications
- **Config**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`
- **Files**: `utils/telegram-bot.js`, `jobs/telegram.js`
- **Fallback**: Console logging

### 2. Redis (Optional)
- **Purpose**: Session storage, state management, queue
- **Config**: `REDIS_URL`, `REDIS_NAMESPACE`
- **Files**: `utils/state-store.js`, `utils/bridge.js`
- **Fallback**: In-memory storage (`utils/queue-fallback.js`)

### 3. TURN Server (Optional)
- **Purpose**: NAT traversal for WebRTC
- **Config**: `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`, `TURN_SECRET`
- **Files**: `utils/turn-credentials.js`, `jobs/turn-rotation.js`
- **Fallback**: STUN-only mode

### 4. Sentry (Optional)
- **Purpose**: Error tracking
- **Config**: `SENTRY_DSN`
- **Files**: `utils/sentry.js`
- **Fallback**: Winston logging only

### 5. Prometheus/Grafana (Optional)
- **Purpose**: Monitoring and alerting
- **Config**: `monitoring/prometheus.yml`
- **Files**: `utils/metrics.js`, `monitoring/grafana/`
- **Access**: Prometheus (9090), Grafana (3001)

### 6. Socket.IO (Required)
- **Purpose**: Real-time communication
- **Config**: Built-in
- **Files**: `socket/handlers.js`, `socket/admin-auth.js`
- **Features**: Perfect negotiation, auto-reconnection, rate limiting

---

## ⚙️ Critical Configurations

### Environment Variables (.env)
```bash
# Server
NODE_ENV=production
PORT=3000
PUBLIC_URL=https://adminara.onrender.com

# Security
SESSION_SECRET=<required>
COOKIE_SECRET=<required>
ENABLE_CSRF=true

# Telegram (optional)
TELEGRAM_BOT_TOKEN=<optional>
TELEGRAM_ADMIN_CHAT_ID=<optional>

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_NAMESPACE=support

# TURN Server (optional)
TURN_SERVER_URL=turn:server.com:3478
TURN_USERNAME=<optional>
TURN_CREDENTIAL=<optional>
TURN_SECRET=<optional>
TURN_MODE=static|rest
TURN_TTL=300

# Monitoring (optional)
SENTRY_DSN=<optional>
ALLOWED_METRICS_ORIGINS=https://adminara.onrender.com

# Features
ENABLE_QUEUE=true
ENABLE_PII_MASKING=true
MAX_CONNECTIONS=50
RATE_LIMIT_MAX=100
```

### Socket.IO Configuration (server.js)
```javascript
const io = socketIO(server, {
  cors: corsOptions,
  pingTimeout: 15000,
  pingInterval: 10000,
  transports: ['websocket', 'polling'],
  perMessageDeflate: { threshold: 0, level: 9 }
});
```

### WebRTC Configuration (public/js/webrtc.js)
```javascript
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: TURN_SERVER_URL, username, credential } // if available
  ],
  iceCandidatePoolSize: 10
};
```

### Rate Limiting (middleware/rate-limit-enhanced.js)
```javascript
// Global: 100 req/15min
// Admin: 50 req/15min
// OTP: 5 req/5min
// Socket.IO: 100 events/min per event type
```

---

## 🔄 Data Flow

### Customer → Admin Call Flow
```
1. Customer (index.html)
   ↓ Socket.IO connect
2. Server (socket/handlers.js)
   ↓ Emit 'queue:position'
3. Customer added to queue
   ↓ Admin connects
4. Admin (admin.html)
   ↓ Socket.IO connect (with auth)
5. Server matches customer ↔ admin
   ↓ Emit 'call:start'
6. WebRTC negotiation (perfect negotiation)
   ↓ ICE candidates exchange
7. Peer connection established
   ↓ Media streams
8. Video call active
```

### OTP Authentication Flow
```
1. Admin → POST /admin/otp/request
   ↓ Generate 6-digit code
2. Server → Telegram Bot
   ↓ Send OTP to admin
3. Admin receives OTP
   ↓ POST /admin/otp/verify {code}
4. Server validates OTP
   ↓ Create session token
5. Server → Set httpOnly cookie
   ↓ Session active
6. Admin authenticated
```

---

## 📊 Key Metrics

### Prometheus Metrics (utils/metrics.js)
- `http_requests_total` - HTTP request counter
- `http_request_duration_seconds` - Request latency
- `websocket_connections_total` - Active WebSocket connections
- `webrtc_ice_candidates_total` - ICE candidates by type
- `webrtc_reconnect_attempts` - Reconnection attempts
- `call_duration_seconds` - Call duration histogram
- `queue_wait_time_seconds` - Queue wait time
- `errors_by_type_total` - Errors by type and severity

### Health Checks
- `/health` - Basic health (uptime, status)
- `/ready` - Readiness (dependencies)
- `/health/detailed` - Enhanced health (Redis, Socket.IO, Memory)

---

## 🔐 Security Features

### Authentication
- OTP-based admin login (6-digit, 5min expiry)
- Session tokens (httpOnly cookies)
- JWT with Redis blacklist
- MFA/TOTP support (optional)

### Authorization
- RBAC (roles.yaml)
- Admin session validation
- Socket.IO cookie guard

### Protection
- Rate limiting (HTTP + Socket.IO)
- CSRF protection (production)
- Input validation (Joi schemas)
- XSS/SQL injection prevention
- PII masking in logs
- CSP headers (no unsafe-inline)
- CORS whitelist

---

## 🧪 Testing Infrastructure

### Test Categories (8)
1. Temel Kontroller (6 tests)
2. API Endpoints (5 tests)
3. Bağlantı Testleri (4 tests)
4. Güvenlik Testleri (5 tests)
5. WebRTC Detaylı (8 tests)
6. Performans (4 tests)
7. UI/UX (4 tests)
8. State Management (3 tests)

### Test Tools
- Jest (unit + integration)
- Playwright (E2E)
- k6 (load testing)
- axe-playwright (accessibility)

### Advanced Features
- AI-powered analysis (test-ai-analyzer.js)
- Snapshot/Rollback (test-snapshot.js)
- Multi-format export (test-exporter.js)
- Auto-fix system (tests/auto-fix/)

---

## 📦 Dependencies

### Core
- express (4.x)
- socket.io (4.x)
- ioredis (optional)
- winston (logging)
- helmet (security)
- cors (CORS)

### WebRTC
- No server-side dependencies (client-side only)

### Testing
- jest
- @playwright/test
- k6 (external)
- axe-playwright

### Monitoring
- prom-client (Prometheus)
- @sentry/node (Sentry)

---

## 🚀 Deployment

### Render.com (Production)
- **Config**: render.yaml
- **URL**: https://adminara.onrender.com
- **Health**: /health, /ready
- **Auto-deploy**: GitHub main branch

### Docker
- **Image**: Dockerfile
- **Compose**: docker-compose.yml
- **Services**: app, backup, monitoring

### CI/CD
- **Platform**: GitHub Actions
- **Workflows**: 6 workflows (lint, test, security, build, deploy)
- **Coverage**: 75% (target: 85%)

---

## 📈 Performance Optimizations

- WebRTC connection pool (-44% latency)
- Redis connection pool (+50% throughput)
- CDN-ready headers (1d cache for static)
- Log rotation (14 days)
- Memory leak fixes
- Adaptive bitrate (300kbps-1.5Mbps)
- Ping interval optimization (10s)

---

## 🔧 Maintenance

### Logs
- Location: `logs/`
- Rotation: Daily, 14 days retention
- Format: JSON (production), pretty (development)
- PII Masking: Enabled

### Backups
- Strategy: BACKUP-STRATEGY.md
- Frequency: Daily
- Retention: 7 days
- RTO: 15 minutes
- RPO: 24 hours

### Monitoring
- Prometheus: metrics collection
- Grafana: visualization
- Sentry: error tracking
- Health checks: automated

---

**Status**: ✅ Production Ready
**Last Updated**: 2024
**Next Review**: After Phase 4 (85% coverage)
