# AdminAra - Tam Proje Dokümantasyonu

**Version**: 1.3.6  
**Live URL**: https://adminara.onrender.com  
**Status**: Production Ready  

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Dosya Yapısı](#2-dosya-yapısı)
3. [Core Dosyalar](#3-core-dosyalar)
4. [Frontend Dosyaları](#4-frontend-dosyaları)
5. [Backend Dosyaları](#5-backend-dosyaları)
6. [Sistem Mimarisi](#6-sistem-mimarisi)
7. [Veri Akışları](#7-veri-akışları)
8. [Güvenlik](#8-güvenlik)

---

## 1. Proje Genel Bakış

AdminAra, WebRTC tabanlı gerçek zamanlı canlı video destek uygulamasıdır.

### Temel Özellikler
- ✅ WebRTC Perfect Negotiation Pattern
- ✅ Auto-Reconnect (ICE Restart, <8s)
- ✅ TURN Server Support
- ✅ httpOnly Cookie Security
- ✅ Redis State Store (opsiyonel)
- ✅ BullMQ Queue (opsiyonel)
- ✅ PWA + Service Worker
- ✅ Mobile Optimization

### Teknoloji Stack
- Backend: Node.js + Express + Socket.IO
- Frontend: Vanilla JS + WebRTC
- State: Redis (opsiyonel)
- Deployment: Render.com

---

## 2. Dosya Yapısı

```
ALO/
├── config/index.js              # Env validation
├── jobs/telegram.js             # Telegram queue
├── public/
│   ├── css/components/
│   │   ├── admin.css
│   │   └── hero.css
│   ├── js/
│   │   ├── client.js
│   │   ├── webrtc.js
│   │   └── ...
│   ├── admin.html
│   └── index.html
├── routes/index.js              # HTTP endpoints
├── socket/
│   ├── admin-auth.js
│   └── handlers.js
├── utils/
│   ├── state-store.js
│   ├── admin-session.js
│   └── ...
└── server.js                    # Main server
```

---

## 3. Core Dosyalar

### server.js
Ana sunucu dosyası - Uygulamanın başlangıç noktası

**İçerik:**
- Express app + Socket.IO server
- Middleware: helmet, cors, compression, rate-limit
- Routes mount
- Error handler
- Sentry integration
- Graceful shutdown

**Özellikler:**
- httpOnly cookie session
- COOKIE_SECRET auto-generate
- Redis connection (opsiyonel)
- BullMQ queue (opsiyonel)
- Health check: `/health`
- Metrics: `/metrics` (origin guard)

### config/index.js
Environment variable validation (Envalid)

**Validate edilen:**
- NODE_ENV, PORT, PUBLIC_URL
- SESSION_SECRET, COOKIE_SECRET
- TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
- REDIS_URL
- TURN_URL, TURN_USER, TURN_PASS
- RATE_LIMIT_MAX, MAX_CONNECTIONS

### jobs/telegram.js
BullMQ Telegram notification queue

**İşlevi:**
- Telegram mesajlarını queue'ya al
- 5 retry (exponential backoff)
- Rate limiting (5 msg/sec)
- Fallback notification

---

## 4. Frontend Dosyaları

### public/index.html
Müşteri ana sayfası - Glassmorphism tasarım

**Bölümler:**
1. Hero: Brand + Card
   - "Profesyonel Destek Merkezi"
   - Destek veren: Muhsin
   - İsim input (min 2 char)
   - "Görüşmeyi Başlat" button

2. Footer: KVKK/GDPR + Yenileme

3. Call Screen: Video container
   - Remote/local video
   - Control buttons
   - Status messages

**JS Logic:**
- Name validation
- Button ready state
- Enter key support
- Socket.IO connection
- WebRTC manager

### public/admin.html
Admin panel - OTP authentication

**Bölümler:**
1. Welcome: OTP giriş
   - "Kod Gönder"
   - 6 haneli kod input
   - "Panele Gir"

2. Admin Panel: Video interface
   - Queue panel
   - Diagnostics
   - Control buttons

**JS Logic:**
- OTP request/verify
- Session verification
- WebRTC manager
- Persistent connection

### public/css/components/hero.css
Ana sayfa stilleri

**Özellikler:**
- Gradient background
- Glassmorphism card
- Centered layout
- Button ready state
- Responsive (360px → 420px)

### public/js/webrtc.js
WebRTC Manager - Core logic

**Class: WebRTCManager**

**Methods:**
- start(): Media stream
- createPeerConnection(): RTCPeerConnection
- handleOffer/Answer(): SDP
- handleIceCandidate(): ICE
- handleConnectionFailure(): ICE restart

**Features:**
- Perfect Negotiation
- Auto-reconnect
- TURN support
- Connection monitoring

### public/js/perfect-negotiation.js
Perfect Negotiation Pattern

**İşlevi:**
- Polite/impolite peer
- Glare handling
- Rollback support

**Flow:**
1. Negotiation → offer
2. Offer → remote
3. Answer → setRemoteDescription
4. ICE candidates
5. Connection established

### public/js/client.js
Müşteri tarafı logic

**İşlevi:**
- Socket.IO connection
- WebRTC manager start
- UI event handlers
- Room join/leave

**Events:**
- room:joined
- room:user:joined
- call:ended
- room:timeout

---

## 5. Backend Dosyaları

### routes/index.js
HTTP endpoints

**Endpoints:**
- GET /health: Health check
- GET /metrics: Prometheus (origin guard)
- POST /admin/otp/request: OTP iste
- POST /admin/otp/verify: OTP doğrula
- GET /admin/session/verify: Session check

### socket/admin-auth.js
Admin OTP authentication

**Functions:**
- requestOTP(): 6 haneli kod generate
- verifyOTP(): Kod doğrula
- Redis'e kaydet (60s TTL)
- Telegram queue'ya ekle

### socket/handlers.js
WebRTC signaling handlers

**Events:**
- room:join: Odaya katıl
- offer: SDP offer
- answer: SDP answer
- candidate: ICE candidate
- call:end: Görüşme bitir

**Features:**
- Room management
- Queue support
- Customer name tracking

### utils/state-store.js
Redis state store (fallback: in-memory)

**Functions:**
- getConnectionCount()
- incrementConnectionCount()
- getAdminSocket()
- setCustomerSocket()
- getOTP(), setOTP()
- getSession(), setSession()

### utils/admin-session.js
Admin session management (Redis)

**Functions:**
- createSession(): 12h TTL
- validateSession(): Check + refresh
- revokeSession(): Delete

### utils/rate-limiter.js
Redis-based rate limiter

**Config:**
- 100 requests / 15 min
- Redis store
- Skip: /health, /metrics

### utils/telegram-bot.js
Telegram bot wrapper

**Function:**
- sendMessage(chatId, text)
- Error handling

---

## 6. Sistem Mimarisi

```
┌─────────────────────────────────────────┐
│         CLIENT LAYER                     │
├─────────────────────────────────────────┤
│  Müşteri (Browser)    Admin (Browser)   │
│  - index.html         - admin.html      │
│  - webrtc.js          - OTP auth        │
└────────┬──────────────────┬─────────────┘
         │ WebSocket        │
         │ WebRTC (P2P)     │
┌────────┴──────────────────┴─────────────┐
│         SERVER LAYER                     │
├─────────────────────────────────────────┤
│  Express + Socket.IO                    │
│  - Routes (HTTP)                        │
│  - Socket handlers (WebRTC signaling)   │
│  - Middlewares (security)               │
└────────┬──────────────────┬─────────────┘
         │                  │
┌────────┴──────────────────┴─────────────┐
│      EXTERNAL SERVICES                   │
├─────────────────────────────────────────┤
│  Redis    BullMQ    Telegram    TURN    │
│  Sentry   Prometheus                    │
└─────────────────────────────────────────┘
```

---

## 7. Veri Akışları

### Müşteri Bağlantı Akışı

1. index.html yükle
2. İsim gir + "Görüşmeyi Başlat"
3. Socket.IO bağlantısı
4. room:join emit
5. getUserMedia (camera + mic)
6. RTCPeerConnection oluştur
7. room:joined event
8. Admin katılınca negotiation başla
9. SDP offer/answer
10. ICE candidates
11. Connection established
12. Video stream

### Admin Bağlantı Akışı

1. admin.html yükle
2. Session cookie kontrol
3. "Kod Gönder" → OTP request
4. Server OTP generate → Redis
5. Telegram bot mesaj gönder
6. Kodu gir → OTP verify
7. Session oluştur → httpOnly cookie
8. Panel aç
9. Socket.IO bağlantısı
10. room:join emit
11. getUserMedia
12. RTCPeerConnection oluştur
13. Müşteri katılınca negotiation
14. Connection established
15. Persistent (görüşme bitse de bağlı kalır)

### WebRTC Signaling

```
Müşteri                    Admin
   │                         │
   │ 1. offer                │
   ├────────────────────────>│
   │                         │
   │ 2. answer               │
   │<────────────────────────┤
   │                         │
   │ 3. ICE candidates       │
   │<───────────────────────>│
   │                         │
   │ 4. P2P Connection       │
   │<═══════════════════════>│
```

### Auto-Reconnect

1. Connection failed
2. Monitor detect
3. handleConnectionFailure()
4. ICE restart (offer)
5. Answer
6. New ICE candidates
7. Re-established (<8s)

---

## 8. Güvenlik

### Transport Security
- TLS/SSL: HTTPS + WSS
- DTLS: WebRTC encryption (SRTP)

### Authentication
- Admin: OTP (6 digit) + httpOnly cookie
- Session: 12h, sliding expiration
- Cookie: httpOnly, secure, sameSite

### Authorization
- Origin Guard: Metrics CSRF
- Rate Limiting: 100 req/15min
- Input Validation: Joi schemas

### Data Protection
- No PII storage
- Session encryption: AES-256
- Cookie encryption: AES-256

### Monitoring
- Sentry: Error tracking
- Winston: Structured logging
- Prometheus: Metrics

---

## 9. Deployment

### Render.com Pipeline

```
Developer → git push → GitHub webhook
  → Render auto-deploy
  → npm install
  → Health check
  → Traffic switch
  → Live (2-3 min)
```

### Environment Variables
- NODE_ENV=production
- TELEGRAM_BOT_TOKEN
- TELEGRAM_ADMIN_CHAT_ID
- SESSION_SECRET (auto-generate)
- REDIS_URL (opsiyonel)
- TURN_URL, TURN_USER, TURN_PASS

### Health Check
- Endpoint: /health
- Interval: 30s
- Response: `{ status: "ok" }`

---

**Bu dokümantasyon, AdminAra projesinin tüm teknik detaylarını içerir.**

