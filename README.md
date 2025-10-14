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

# Docker Compose
docker-compose up -d

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

✅ WebRTC Perfect Negotiation Pattern
✅ Auto-Reconnect (ICE Restart, <8s)
✅ TURN Server Support (NAT Traversal)
✅ httpOnly Cookie Security (XSS Protection)
✅ Metrics Origin Guard (CSRF Protection)
✅ Cold Start Optimization
✅ Auto-Deploy (Render.com)
✅ Docker Support
✅ E2E Tests (Reconnect + Glare)
✅ Mobile Optimization (PWA)
✅ Accessibility (a11y)
✅ Offline Support (Service Worker)
✅ Error Tracking (Sentry)
✅ 35%+ Test Coverage
⚠️ Beta (See KNOWN-ISSUES.md)

## Production

- Live: https://adminara.onrender.com
- Admin: https://adminara.onrender.com/admin
- Health: https://adminara.onrender.com/health
- Metrics: https://adminara.onrender.com/metrics (auth required)

## Monitoring

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

## 📚 Dokümantasyon

**⚠️ ÖNEMLİ**: `FULL-DOCUMENTATION.md` dosyası **SİLİNMEMELİ** ve her değişiklikte **GÜNCELLENMELİDİR**.

Bu dosya:
- Tüm proje yapısını açıklar
- Her dosyanın ne işe yaradığını detaylandırır
- Sistem akışlarını gösterir
- Yeni geliştiriciler için başlangıç noktasıdır
- AI'ların projeyi anlaması için gereklidir

**Güncelleme Kuralları:**
- Yeni dosya eklendiğinde → FULL-DOCUMENTATION.md'ye ekle
- Dosya silindiğinde → FULL-DOCUMENTATION.md'den çıkar
- Dosya işlevi değiştiğinde → Açıklamasını güncelle
- Version değiştiğinde → Version numarasını güncelle