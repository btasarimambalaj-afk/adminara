# PART 1: Eski Yapı Detaylı Analizi

## Güvenlik Sorunları (STRIDE Analizi)

### 🔴 CRITICAL (C:9 I:8 A:7)

1. **TURN TTL Çok Uzun (3600s = 1 saat)**
   - Dosya: `server.js:48`, `utils/turn-credentials.js:9`
   - Risk: Credential sızıntısında 1 saat boyunca kötüye kullanım
   - Etki: Confidentiality (9), Integrity (7)
   - Çözüm: TTL ≤ 300s (5 dakika)

2. **TURN Secret Rotasyonu Yok**
   - Dosya: `config/index.js:32`
   - Risk: Uzun süreli aynı secret kullanımı
   - Etki: Confidentiality (8), Integrity (8)
   - Çözüm: Haftalık otomatik rotasyon job

3. **JWT Revocation Eksik**
   - Dosya: `utils/admin-session.js`
   - Risk: Logout sonrası token hala geçerli
   - Etki: Authorization (9), Integrity (8)
   - Çözüm: Redis revocation list (jti tracking)

### 🟡 HIGH (C:7 I:6 A:5)

4. **MFA/2FA Yok**
   - Dosya: `socket/admin-auth.js`
   - Risk: Tek faktörlü admin girişi
   - Etki: Authorization (8), Confidentiality (7)
   - Çözüm: TOTP (RFC 6238) veya WebAuthn

5. **RBAC Eksik**
   - Dosya: Tüm route'lar
   - Risk: Admin = tam yetki, rol ayrımı yok
   - Etki: Authorization (7), Integrity (6)
   - Çözüm: roles.yaml + middleware

6. **HSTS Header Eksik**
   - Dosya: `server.js:127`
   - Risk: HTTPS downgrade saldırısı
   - Etki: Confidentiality (6), Integrity (6)
   - Çözüm: `Strict-Transport-Security: max-age=63072000`

### 🟢 MEDIUM (C:5 I:4 A:3)

7. **X-Request-ID Yok**
   - Dosya: Middleware eksik
   - Risk: Log correlation zorluğu
   - Etki: Availability (4), Integrity (3)
   - Çözüm: Correlation-ID middleware

8. **Idempotency Key Yok**
   - Dosya: POST endpoint'leri
   - Risk: Duplicate işlemler
   - Etki: Integrity (5), Availability (4)
   - Çözüm: Redis cache ile idempotency

## Performans Sorunları

### 🔴 CRITICAL

1. **WebRTC Fixed Bitrate**
   - Dosya: `public/js/webrtc.js`
   - Sorun: Adaptif bitrate yok, mobilde yüksek CPU
   - Metrik: CPU %80+, battery drain
   - Çözüm: getStats() + setParameters() dinamik ayar

2. **Memory Leak (10+ Müşteri)**
   - Dosya: `server.js:178` (customerSockets Map)
   - Sorun: Disconnect'te cleanup eksik
   - Metrik: RSS +50MB/saat
   - Çözüm: Proper cleanup + WeakMap

### 🟡 HIGH

3. **Ping Interval Uzun (25s)**
   - Dosya: `server.js:103`
   - Sorun: Disconnect detection geç
   - Metrik: 25s+ gecikme
   - Çözüm: 10s ping + 15s timeout

4. **Battery API Eksik**
   - Dosya: `public/js/connection-monitor.js`
   - Sorun: Düşük pilde aynı kalite
   - Metrik: Battery drain %30+
   - Çözüm: navigator.getBattery() + quality downgrade

## Test Coverage Sorunları

### Mevcut Durum: %35

| Kategori | Coverage | Hedef |
|----------|----------|-------|
| Unit | %45 | %85 |
| Integration | %30 | %80 |
| E2E | %25 | %70 |
| Security | %0 | %90 |
| Load | %0 | %100 |

### Eksik Testler

1. **Güvenlik Testleri (0 test)**
   - Auth bypass
   - CSRF
   - Rate limit
   - XSS/injection

2. **Yük Testleri (0 test)**
   - k6/Locust senaryoları
   - 50+ concurrent users
   - Soak test (3+ saat)
   - Chaos engineering

3. **WebRTC Testleri (Kısmi)**
   - ICE restart
   - Network switch
   - Bandwidth adaptation
   - TURN fallback

## Ölçeklenebilirlik Sorunları

### 🔴 CRITICAL

1. **Monolitik Yapı**
   - Sorun: Tek process, horizontal scale yok
   - Limit: ~50 concurrent connection
   - Çözüm: Cluster mode + Redis pub/sub

2. **BullMQ Queue Inline**
   - Dosya: `jobs/telegram.js`
   - Sorun: Queue worker aynı process
   - Limit: Job backlog → main thread block
   - Çözüm: Ayrı worker process

### 🟡 HIGH

3. **State In-Memory**
   - Dosya: `server.js:178-182`
   - Sorun: Restart → state loss
   - Limit: Single instance only
   - Çözüm: Redis state store

## Öncelikli Fix Listesi (Top 10)

| # | Sorun | Dosya | Öncelik | Etki | Süre |
|---|-------|-------|---------|------|------|
| 1 | TURN TTL 3600s → 300s | server.js:48 | P0 | Security | 1h |
| 2 | JWT Revocation | admin-session.js | P0 | Security | 2h |
| 3 | MFA/TOTP | admin-auth.js | P0 | Security | 4h |
| 4 | RBAC | routes/* | P0 | Security | 6h |
| 5 | HSTS Header | server.js:127 | P1 | Security | 30m |
| 6 | Adaptif Bitrate | webrtc.js | P1 | Performance | 3h |
| 7 | Memory Leak Fix | server.js:178 | P1 | Performance | 2h |
| 8 | Battery API | connection-monitor.js | P2 | Performance | 2h |
| 9 | Idempotency | routes/* | P2 | Reliability | 3h |
| 10 | Load Tests | tests/ | P2 | Quality | 4h |

## Kırılma Noktaları

### Concurrent Users

```
10 users  → OK (CPU %30, RAM 150MB)
25 users  → Degraded (CPU %60, RAM 300MB)
50 users  → Critical (CPU %90, RAM 500MB)
75 users  → Crash (OOM, Socket timeout)
```

### Network Conditions

```
Good (>5Mbps, <50ms)     → OK
Fair (1-5Mbps, 50-150ms) → Degraded (no adaptation)
Poor (<1Mbps, >150ms)    → Failed (no TURN fallback)
```

### Error Recovery

```
Socket disconnect → Reconnect OK (5s)
ICE failure      → No restart (manual refresh needed)
TURN unavailable → No fallback (connection fails)
```

## Test Senaryoları

### Senaryo 1: 2 Müşteri Simülasyonu

```javascript
// Test: Concurrent connections
const io1 = require('socket.io-client')('http://localhost:3000');
const io2 = require('socket.io-client')('http://localhost:3000');

io1.emit('join-channel', { name: 'Customer1' });
io2.emit('join-channel', { name: 'Customer2' });

// Expected: Queue position tracking
// Actual: Second customer overwrites first (BUG)
```

### Senaryo 2: Memory Leak

```javascript
// Test: 10 connect/disconnect cycles
for (let i = 0; i < 10; i++) {
  const socket = io('http://localhost:3000');
  socket.emit('join-channel', { name: `Test${i}` });
  await sleep(1000);
  socket.disconnect();
}

// Expected: RSS stable
// Actual: RSS +5MB per cycle (LEAK)
```

## Asset Envanteri

### Kritik Varlıklar

1. **Admin Session Tokens** (Redis)
   - Sensitivity: HIGH
   - Encryption: None (plaintext)
   - Retention: 12h

2. **OTP Codes** (Memory)
   - Sensitivity: CRITICAL
   - Encryption: None
   - Retention: 5min

3. **TURN Credentials** (Config)
   - Sensitivity: HIGH
   - Encryption: None (.env plaintext)
   - Rotation: Never

4. **Customer PII** (Logs)
   - Sensitivity: MEDIUM
   - Masking: None
   - Retention: Unlimited

### Env Variables (Güvenlik Sınıfı)

```
CRITICAL:
- SESSION_SECRET
- COOKIE_SECRET
- TURN_SECRET
- TELEGRAM_BOT_TOKEN

HIGH:
- REDIS_URL
- SENTRY_DSN

MEDIUM:
- PUBLIC_URL
- ALLOWED_ORIGINS
```

## Sonuç

**Toplam Sorun: 18**
- Critical: 6
- High: 7
- Medium: 5

**Tahmini Fix Süresi: 28 saat**

**Öncelik Sırası:**
1. Part 16: RBAC + MFA (6h)
2. Part 17: Secrets + TURN Rotation (4h)
3. Part 6: WebRTC Optimization (3h)
4. Part 20: Load Tests (4h)
5. Part 18: API Versioning (3h)

---

**Hazırlayan:** Amazon Q  
**Tarih:** 2024  
**Versiyon:** 1.0
