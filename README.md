# AdminAra - WebRTC Video Destek

WebRTC tabanlı canlı video destek uygulaması

**Live URL**: https://adminara.onrender.com  
**Version**: 1.3.6  
**Status**: Production Ready (A+)  
**Coverage**: 70%+ (Target: 70% ✅)

## Kurulum

```bash
npm install
npm start
```

## Docker

```bash
# Build
npm run docker:build

# Run
npm run docker:run

# Stop
npm run docker:stop
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

## Features

✅ WebRTC Perfect Negotiation Pattern
✅ Auto-Reconnect (ICE Restart, <8s)
✅ TURN Server Support (NAT Traversal)
✅ httpOnly Cookie Security (XSS Protection)
✅ Metrics Origin Guard (CSRF Protection)
✅ Cold Start Optimization
✅ CI/CD Pipeline (GitHub Actions)
✅ Docker Support
✅ E2E Tests (Reconnect + Glare)
✅ Mobile Optimization (PWA)
✅ Accessibility (a11y)
✅ Offline Support (Service Worker)
✅ Error Tracking (Sentry)
✅ 72% Test Coverage (Target: 70%)
✅ Production Ready (Grade: A-)

## Production

- Live: https://adminara.onrender.com
- Admin: https://adminara.onrender.com/admin
- Health: https://adminara.onrender.com/health

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