# AdminAra - WebRTC Video Support

WebRTC tabanlı canlı video destek uygulaması

**Live URL**: https://adminara.onrender.com  
**Version**: 1.3.8  
**Status**: ✅ Production Ready

---

## 🚀 Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your secrets

# Start
npm start
```

**URLs:**
- Customer: https://adminara.onrender.com
- Admin: https://adminara.onrender.com/admin
- Test Suite: https://adminara.onrender.com/test-suite.html
- Health: https://adminara.onrender.com/health
- API Docs: https://adminara.onrender.com/api-docs

---

## ✨ Features

### Core
- ✅ WebRTC Perfect Negotiation (glare-free)
- ✅ Auto-Reconnect (<8s, ICE Restart)
- ✅ TURN Server Support (NAT Traversal)
- ✅ Adaptive Bitrate (300kbps-1.5Mbps)
- ✅ Connection Quality Monitoring

### Security
- ✅ Helmet + Strict CSP (nonce-based)
- ✅ CORS Whitelist
- ✅ Rate Limiting (DDoS protection)
- ✅ CSRF Protection
- ✅ httpOnly Cookies (XSS protection)
- ✅ Input Validation (Joi)
- ✅ PII Masking (logs)

### Mobile
- ✅ iOS Safari Compatible
- ✅ Android Chrome Compatible
- ✅ PWA Install Prompt
- ✅ Battery Monitoring
- ✅ Offline Support (Service Worker)

### DevOps
- ✅ CI/CD Pipeline (6 workflows)
- ✅ Automated Testing (lint, unit, integration, e2e)
- ✅ Security Scanning (npm audit, CodeQL)
- ✅ Docker Support
- ✅ Auto-Deploy (Render.com)
- ✅ Health Checks (/health, /ready)
- ✅ Prometheus Metrics

### Testing
- ✅ Unit Tests (Jest)
- ✅ Integration Tests
- ✅ E2E Tests (Playwright)
- ✅ Load Tests (k6)
- ✅ Automated Test Suite (39 tests, 8 categories)
- ✅ Scheduled Tests (4x daily + Telegram)

---

## 📦 Installation

### Local Development
```bash
npm install
npm start
```

### Docker
```bash
docker-compose up -d
```

### Production (Render.com)
```bash
git push origin main  # Auto-deploys
```

---

## 🔧 Configuration

### Required Environment Variables
```bash
SESSION_SECRET=<random-64-char>
COOKIE_SECRET=<random-64-char>
NODE_ENV=production
PORT=3000
```

### Optional (Recommended)
```bash
# Telegram
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_ADMIN_CHAT_ID=<chat-id>

# Redis
REDIS_URL=<redis-url>

# TURN Server
TURN_SERVER_URL=turn:server.com:3478
TURN_MODE=rest
TURN_SECRET=<secret>

# Monitoring
SENTRY_DSN=<sentry-dsn>
```

---

## 🧪 Testing

```bash
# Unit + Integration
npm test

# E2E
npm run test:e2e

# Automated Suite
npm run test:auto

# Scheduled Tests
npm run cron
```

---

## 📊 Monitoring

### Prometheus Metrics
```
http://localhost:9090
```

### Grafana Dashboard
```
http://localhost:3001
Username: admin
Password: admin
```

### Key Metrics
- `websocket_connections_total` - Active connections
- `http_request_duration_seconds` - Response time
- `webrtc_ice_success_ratio` - ICE success rate

---

## 📚 Documentation

- [FULL-DOCUMENTATION.md](./FULL-DOCUMENTATION.md) - Complete docs
- [SOCKET-API.md](./SOCKET-API.md) - Socket.IO events
- [SECURITY.md](./SECURITY.md) - Security policy
- [PRODUCTION-LAUNCH-PACK.md](./PRODUCTION-LAUNCH-PACK.md) - Go/No-Go checklist
- [AUTOMATION-TEST-SUITE.md](./AUTOMATION-TEST-SUITE.md) - Test automation
- [API Docs](https://adminara.onrender.com/api-docs) - Swagger UI

---

## 🔐 Security

Report vulnerabilities: **security@adminara.com**

See [SECURITY.md](./SECURITY.md) for details.

---

## 📄 License

MIT

---

## 🤝 Support

- GitHub Issues: https://github.com/btasarimambalaj-afk/adminara/issues
- Documentation: [docs/](./docs/)

---

**Production Ready** ✅ | **Version 1.3.8** | **Last Updated: 2025-10-15**
