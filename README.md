# AdminAra - WebRTC Video Destek

WebRTC tabanlı canlı video destek uygulaması

**Live URL**: https://adminara.onrender.com  
**Version**: 1.3.8  
**Status**: Production Ready  
**Coverage**: 54%+ (Target: 85%)

## Kurulum

```bash
# 1. Dependencies
npm install

# 2. Environment variables
cp .env.example .env
# .env dosyasını düzenle:
# - SESSION_SECRET (required)
# - COOKIE_SECRET (required)
# - TELEGRAM_BOT_TOKEN (optional)
# - TELEGRAM_ADMIN_CHAT_ID (optional)
# - REDIS_URL (optional)
# - ALLOWED_METRICS_ORIGINS (optional, production recommended)

# 3. Start
npm start
```

## Docker

```bash
# Build
docker build -t adminara .

# Run
docker run -p 3000:3000 --env-file .env adminara

# Docker Compose (App)
docker-compose up -d

# Docker Compose (Backup Service)
docker-compose -f docker-compose.backup.yml up -d

# Docker Compose (Monitoring)
docker-compose -f docker-compose.monitoring.yml up -d

# Stop
docker-compose down
```

## Test

```bash
# Unit + Integration Tests
npm test

# E2E Tests
npm run test:e2e

# E2E UI Mode
npm run test:e2e:ui

# Coverage
npm run test:coverage
```

## Kullanım

- **Müşteri**: https://adminara.onrender.com
- **Admin**: https://adminara.onrender.com/admin
- **Test**: https://adminara.onrender.com/test-suite.html
- **Health**: https://adminara.onrender.com/health
- **Readiness**: https://adminara.onrender.com/ready
- **Metrics**: https://adminara.onrender.com/metrics

## Features

### WebRTC

✅ Perfect Negotiation Pattern (glare-free)
✅ Auto-Reconnect (ICE Restart, <8s)
✅ TURN Server Support (NAT Traversal)
✅ Adaptive Bitrate (300kbps-1.5Mbps)
✅ Connection Quality Monitoring

### Security

✅ httpOnly Cookie (XSS Protection)
✅ CSRF Protection (production)
✅ Rate Limiting (DDoS protection)
✅ Input Validation (Joi schemas)
✅ PII Masking (logs)

### Performance

✅ WebRTC Connection Pool (-44% latency)
✅ Redis Connection Pool (+50% throughput)
✅ CDN-Ready Headers
✅ Log Rotation (14 days)
✅ Memory Leak Fixed

### Mobile

✅ iOS Safari Compatible
✅ Android Chrome Compatible
✅ PWA Install Prompt
✅ Battery Monitoring (<20%)
✅ Offline Support (Service Worker)

### DevOps

✅ CI/CD Pipeline (6 workflows)
✅ Automated Testing (lint, unit, integration, e2e)
✅ Security Scanning (npm audit, Snyk, CodeQL)
✅ Docker Build & Push
✅ Auto-Deploy (Render.com)
✅ PR Templates & Issue Templates
✅ Backup Strategy (RTO: 15min)
✅ Health Checks (/health, /ready)

### Testing

✅ Unit Tests (54% coverage)
✅ Integration Tests
✅ E2E Tests (Playwright)
✅ Load Tests (k6)
✅ Security Tests (npm audit)

### Monitoring

✅ Prometheus Metrics
✅ Grafana Dashboard
✅ Sentry Error Tracking
✅ Business Metrics
✅ Swagger API Docs

### i18n (Optional)

✅ Multi-language Support (TR, EN, DE, AR)
✅ Auto Language Detection
✅ RTL Support (Arabic)
✅ localStorage Persistence

**Production Ready**: 99.9%

## Production

- Live: https://adminara.onrender.com
- Admin: https://adminara.onrender.com/admin
- Health: https://adminara.onrender.com/health
- Metrics: https://adminara.onrender.com/metrics (auth required)

## Monitoring

### Local Monitoring Stack

```bash
# Start Prometheus + Grafana
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

**Grafana Dashboard**:

- AdminAra System Overview (WebSocket, HTTP, WebRTC ICE, Queue)

Detaylı bilgi için [monitoring/README.md](./monitoring/README.md) dosyasına bakın.

### Prometheus Queries

```promql
# Uptime percentage (last 24h)
100 * (1 - (sum(rate(http_requests_total{status=~"5.."}[24h])) / sum(rate(http_requests_total[24h]))))

# Active WebSocket connections
websocket_connections_total

# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### Sentry Integration

```bash
# Set Sentry DSN in .env
SENTRY_DSN=https://your-dsn@sentry.io/project
```

## 📐 Architecture

Detaylı mimari diyagramlar için [docs/diagrams](./docs/diagrams) klasörüne bakın.

### Quick Links

- [System Architecture](./docs/diagrams/system-architecture.mmd) - Complete system layers and components
- [WebRTC Call Flow](./docs/diagrams/webrtc-flow.mmd) - Perfect Negotiation Pattern sequence
- [Authentication Sequence](./docs/diagrams/authentication-sequence.mmd) - OTP/JWT flow
- [Deployment Diagram](./docs/diagrams/deployment-diagram.mmd) - Render.com production setup
- [Data Flow](./docs/diagrams/data-flow.mmd) - Customer and admin user flows

**View on GitHub**: Mermaid diagrams render automatically

---

## 📚 Dokümantasyon

### Core Documentation

- [FULL-DOCUMENTATION.md](./FULL-DOCUMENTATION.md) - Complete project documentation
- [SOCKET-API.md](./SOCKET-API.md) - Socket.IO events (15+ client, 20+ server)
- [API Documentation](https://adminara.onrender.com/api-docs) - Swagger UI (REST API)
- [Architecture Diagrams](./docs/README.md) - Mermaid diagrams
- [I18N.md](./docs/I18N.md) - Internationalization guide
- [CI-CD.md](./docs/CI-CD.md) - CI/CD pipeline documentation

### Operational Guides

- [MOBILE-COMPATIBILITY.md](./MOBILE-COMPATIBILITY.md) - iOS Safari & Android Chrome
- [BACKUP-STRATEGY.md](./BACKUP-STRATEGY.md) - Backup & disaster recovery
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) - Deployment instructions
- [RENDER-DEPLOY.md](./RENDER-DEPLOY.md) - Render.com specific guide

### Development

- [EKSIKLER.md](./EKSIKLER.md) - Feature roadmap (99.9% complete)
- [UYGULAMA-DURUMU.md](./UYGULAMA-DURUMU.md) - Implementation status

**⚠️ ÖNEMLİ**: `FULL-DOCUMENTATION.md` dosyası **SİLİNMEMELİ** ve her değişiklikte **GÜNCELLENMELİDİR**.
