# AdminAra Advanced Test & Repair Suite (Full Automation)

Kapsamlı otomatik test ve onarım sistemi. 8 PART kategorisinde 39 test, otomatik düzeltme, zamanlama ve Telegram bildirimi.

## Özellikler

✅ **8 PART Test Kategorisi** (39 test)
- PART-1: Temel Kontroller (6 test)
- PART-2: API Endpoints (5 test)
- PART-3: Bağlantı Testleri (4 test)
- PART-4: Güvenlik Testleri (5 test)
- PART-5: WebRTC Detaylı (8 test)
- PART-6: Performans (4 test)
- PART-7: UI/UX (4 test)
- PART-8: State Management (3 test)

✅ **Auto-Fix System** (Pattern-based repairs)
✅ **Scheduled Execution** (10:00, 14:00, 20:00, 23:00 Europe/Istanbul)
✅ **Telegram Notifications** (Test summaries)
✅ **Multi-Format Reports** (MD, JSON)

## Kurulum

```bash
# Dependencies already installed
npm install

# Configure Telegram (optional)
# Add to .env:
# TELEGRAM_BOT_TOKEN=your_token
# TELEGRAM_ADMIN_CHAT_ID=your_chat_id
```

## Kullanım

### Manuel Test Çalıştırma

```bash
# Run all tests
npm run test:auto

# Or directly
node scripts/test-runner-simple.js
```

### Zamanlı Çalıştırma

```bash
# Start scheduler (runs at 10:00, 14:00, 20:00, 23:00)
npm run scheduler

# Or directly
node scripts/scheduler.js
```

### Konfigürasyon

`scripts/schedule.config.json`:

```json
{
  "timezone": "Europe/Istanbul",
  "times": ["10:00", "14:00", "20:00", "23:00"],
  "enable": true,
  "telegramEnabled": true,
  "autoFixEnabled": true
}
```

## Raporlar

Test çalıştırıldığında `reports/` klasöründe oluşturulur:

- **test_report.md** — Ana rapor (her PART detaylı)
- **test_results.json** — Makine okunur özet
- **autofix_suggestions.md** — Uygulanan/önerilen düzeltmeler
- **akilli-rapor.md** — Kısa özet

### Örnek Rapor

```markdown
# AdminAra Test Report

**Timestamp**: 2025-10-15T18:07:06.791Z
**Duration**: 0.0s
**Coverage**: 84.6%

## Summary

- ✅ Passed: 33
- ❌ Failed: 6
- 📊 Total: 39

### PART-1: Temel Kontroller

- ✅ Socket.io — Connection available
- ✅ WebRTC — RTCPeerConnection supported
...

PART-1 Tamamlandı
PART-2 Tamamlandı
...
PART-8 Tamamlandı
```

## Telegram Bildirimi

Zamanlı testler çalıştığında Telegram'a özet gönderilir:

```
✅ Otomatik Test Raporu
Saat: 15.10.2025 10:00

Passed: 33
Failed: 6
Total: 39
Duration: 0.5s
Coverage: 84.6%

Not: Ayrıntılar için test_report.md
```

### Backend Proxy Endpoint

```bash
POST /api/telegram/send
Content-Type: application/json

{
  "text": "Test message"
}
```

## Auto-Fix Kuralları

Sistem şu sorunları otomatik tespit eder ve düzeltme önerir:

1. **Kod tekrarları** → Ortak yardımcı fonksiyona taşı
2. **Socket reconnect eksik** → Otomatik yeniden bağlanma ekle
3. **Fetch retry eksik** → Exponential backoff wrapper
4. **CSP zayıf** → `unsafe-inline` kaldır, nonce/sha256 ekle
5. **CORS wildcard** → Whitelist domain listesi
6. **WebRTC ICE/TURN** → Güvenli STUN/TURN fallback
7. **Memory leak** → Event listener temizliği
8. **UI a11y** → ARIA etiketleri ve kontrast önerileri

## Test Kategorileri Detay

### PART-1: Temel Kontroller
- Socket.io (connect/disconnect/reconnect)
- WebRTC (ICE üretimi, fallback)
- Fetch API (timeout, retry)
- Browser özellikleri
- LocalStorage (kapasite, parse)
- Service Worker (cache, offline)

### PART-2: API Endpoints
- Health Check (`/health`)
- ICE Servers (`/config/ice-servers`)
- Metrics (`/metrics`)
- Admin Session (`/admin/session/verify`)
- OTP Request (`/admin/otp/request`)

### PART-3: Bağlantı Testleri
- Socket Bağlantı
- Ping Test (RTT)
- Socket Reconnect
- Socket Events (emit/ack)

### PART-4: Güvenlik Testleri
- OTP Metrics suistimali
- Rate Limiter
- OTP Lockout
- CSP Headers (unsafe-inline)
- CORS Policy (preflight, whitelist)

### PART-5: WebRTC Detaylı
- Peer Connection yaşam döngüsü
- ICE Gathering timeout/fallback
- Media Stream ekleme/çıkarma
- Reconnect Logic (stream rebind)
- TURN Server fallback
- Data Channel (open/message/close)
- ICE Restart
- Perfect Negotiation (glare çözümü)

### PART-6: Performans
- Latency (response time)
- Bandwidth (adaptive bitrate)
- Memory Usage (leak analizi)
- CPU Usage (profiling)

### PART-7: UI/UX
- Responsive Design (breakpoints)
- Accessibility (axe-core/Lighthouse)
- Dark Mode tutarlılığı
- Animations (jank/FPS)

### PART-8: State Management
- State Store tutarlılığı
- Session Persist
- Queue System (retry, veri kaybı)

## Production Deployment

### Docker

```bash
# Add to docker-compose.yml
services:
  scheduler:
    build: .
    command: npm run scheduler
    env_file: .env
    restart: unless-stopped
```

### Systemd Service

```ini
[Unit]
Description=AdminAra Test Scheduler
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/adminara
ExecStart=/usr/bin/node scripts/scheduler.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### Render.com Background Worker

```yaml
# render.yaml
services:
  - type: worker
    name: test-scheduler
    env: node
    buildCommand: npm install
    startCommand: npm run scheduler
    envVars:
      - key: NODE_ENV
        value: production
```

## Troubleshooting

### Testler çalışmıyor

```bash
# Check server is running
curl http://localhost:3000/health

# Check reports directory
ls -la reports/

# Run with debug
DEBUG=* node scripts/test-runner-simple.js
```

### Telegram bildirimi gelmiyor

```bash
# Check .env configuration
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_ADMIN_CHAT_ID

# Test endpoint
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message"}'
```

### Zamanlama çalışmıyor

```bash
# Check config
cat scripts/schedule.config.json

# Verify timezone
node -e "console.log(new Date().toLocaleString('tr-TR', {timeZone: 'Europe/Istanbul'}))"

# Check cron logs
journalctl -u adminara-scheduler -f
```

## API Reference

### POST /api/telegram/send

Backend proxy for Telegram notifications.

**Request:**
```json
{
  "text": "Message content"
}
```

**Response:**
- `204` — Success
- `400` — Invalid text parameter
- `503` — Telegram not configured
- `500` — Send failed

## Başarı Kriterleri

- ✅ 8 PART'ın tamamı koşuldu ve raporlandı
- ✅ SYSTEM_OVERVIEW.md mevcut ve güncel
- ✅ test_report.md "Part X Tamamlandı" satırlarını içeriyor
- ✅ Auto-fix sistemi aktif
- ✅ Zamanlama saatleri yapılandırıldı
- ✅ JSON/MD çıktıları indirilebilir durumda
- ✅ Telegram entegrasyonu hazır

## Roadmap

- [ ] E2E test entegrasyonu (Playwright)
- [ ] Load test entegrasyonu (k6)
- [ ] Slack/Discord bildirim desteği
- [ ] Web dashboard (real-time test results)
- [ ] Auto-fix PR creation (GitHub API)
- [ ] Historical trend analysis
- [ ] Performance regression detection

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-15  
**Maintainer**: AdminAra Team
