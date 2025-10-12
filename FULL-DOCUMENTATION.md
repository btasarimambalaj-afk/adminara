# AdminAra - Detaylı Proje Dokümantasyonu

**Version**: 1.3.7  
**Live**: https://adminara.onrender.com  
**Status**: Beta (Critical fixes completed)  

Bu dokümantasyon, projedeki **her dosyanın** ne işe yaradığını detaylı açıklar.

---

## 📁 PROJE YAPISI VE DOSYALAR

### 🔧 ROOT DOSYALAR

**server.js** - Ana sunucu (Express + Socket.IO, middleware, routes, error handler, Redis, BullMQ, graceful shutdown)

**package.json** - NPM bağımlılıkları (express, socket.io, redis, bullmq, joi, helmet, winston, sentry)

**.env** - Environment variables (NODE_ENV, PORT, SESSION_SECRET, TELEGRAM_BOT_TOKEN, REDIS_URL, TURN config)

**render.yaml** - Render.com deployment (auto-deploy: true, health check, env vars)

**Dockerfile** - Docker image (node:16-alpine, npm install, expose 3000)

**docker-compose.yml** - Docker services (app + redis)

**jest.config.js** - Jest test config (coverage 70%, timeout 10s)

**playwright.config.js** - Playwright E2E config (chromium, firefox, webkit)

**.gitignore** - Git ignore (node_modules, coverage, .env)

---

### 📁 config/

**config/index.js** - Envalid env validation (NODE_ENV, PORT, SESSION_SECRET, TELEGRAM_BOT_TOKEN, REDIS_URL, TURN config, RATE_LIMIT_MAX, MAX_CONNECTIONS, ENABLE_QUEUE)

---

### 💼 jobs/

**jobs/telegram.js** - BullMQ Telegram queue (5 retry, exponential backoff, rate limit 5 msg/sec, fallback notification)

---

### 🎨 public/

**index.html** - Müşteri sayfası (hero, card, footer, call screen, Socket.IO, WebRTC, name validation, button ready state)

**admin.html** - Admin panel (OTP giriş, queue panel, diagnostics, persistent connection)

**404.html** - 404 error sayfası

**500.html** - 500 error sayfası

**test-suite.html** - Test utilities

**manifest.json** - PWA manifest (icons, theme, display standalone)

**service-worker.js** - Offline support (cache-first static, network-first API)

**favicon.ico** - Favicon

---

### 🎨 public/css/

**main.css** - Genel stiller (reset, typography, container, video, buttons, spinner)

**components/hero.css** - Ana sayfa (glassmorphism, gradient, card, input, button ready state, responsive 360px→420px)

**components/admin.css** - Admin panel (3-column grid, dark theme, auth card, stats, queue)

**accessibility.css** - a11y (focus-visible, sr-only, reduced-motion, high-contrast)

**mobile.css** - Mobil responsive (touch-friendly 44px, safe-area-insets, 100dvh)

**toast.css** - Toast notifications (fixed top-right, success/error/warning/info, slide-in)

**diagnostics.css** - WebRTC diagnostics (RTT, packet loss, jitter, color-coded)

**admin-panel.css** - Admin dashboard (queue panel, current call, stats grid)

**welcome.css** - Welcome screen (centered card, title, description, button)

---

### 📱 public/js/

**webrtc.js** - WebRTC Manager class (start, createPeerConnection, handleOffer/Answer, handleIceCandidate, handleConnectionFailure, cleanup)

**perfect-negotiation.js** - Perfect Negotiation Pattern (polite/impolite peer, glare handling, rollback)

**client.js** - Müşteri logic (Socket.IO, WebRTC manager, UI events, room:joined, call:ended)

**connection-monitor.js** - WebRTC stats tracking (RTT, packet loss, jitter, quality)

**helpers.js** - Utility functions (createTimer, setupControlButtons, formatTime, showError)

**toast.js** - Toast notification system (showToast, auto-dismiss, slide-in)

**warmup.js** - Cold start prevention (fetch /health every 5 min)

**accessibility.js** - Accessibility features (keyboard navigation, focus trap, screen reader)

**queue-ui.js** - Queue UI updates (queue:updated, customer list, stats)

**tests.js** - Frontend test utilities (WebRTC test, media device test, TURN test)

---

### 🛣️ routes/

**routes/index.js** - HTTP endpoints (GET /health, GET /metrics, POST /admin/otp/request, POST /admin/otp/verify, GET /admin/session/verify)

---

### 🔌 socket/

**socket/admin-auth.js** - Admin OTP authentication (requestOTP, verifyOTP, Redis, Telegram queue, session create)

**socket/handlers.js** - WebRTC signaling handlers (room:join, offer, answer, candidate, call:end, disconnect, queue support)

---

### 🛠️ utils/

**utils/state-store.js** - Redis state store (connection count, admin/customer sockets, OTP, session, queue, fallback in-memory)

**utils/admin-session.js** - Admin session management (createSession, validateSession, revokeSession, 12h TTL, sliding expiration)



**utils/error-handler.js** - Global error handler (Express middleware, Winston log, Sentry, hide stack trace)

**utils/logger.js** - Winston logger (error/warn/info/debug, JSON format, file rotation)

**utils/metrics.js** - Prometheus metrics (http_requests_total, http_request_duration_seconds, websocket_connections, webrtc_connections, redis_operations)

**utils/middleware.js** - Express middlewares (requestLogger, notFound, errorHandler, validateRequest)

**utils/origin-guard.js** - CSRF/Origin protection (checkOrigin, validate Origin/Referer, block cross-origin /metrics)

**utils/rate-limiter.js** - Redis-based rate limiter (100 req/15min per IP, skip /health /metrics)

**utils/sentry.js** - Sentry error tracking (init, captureException, breadcrumbs, release tracking)



**utils/telegram-bot.js** - Telegram bot wrapper (sendMessage, error handling)

**utils/turn-credentials.js** - TURN server credentials (static/dynamic mode, getTurnCredentials)

**utils/validation.js** - Joi validation schemas (otpRequestSchema, otpVerifySchema, roomJoinSchema)

---

### 🧪 tests/

**tests/e2e/** - Playwright E2E tests (admin-flow, customer-flow, health-check, socket-reconnect, webrtc-glare)

**tests/integration/** - Integration tests (api, config-turn, metrics-guard, session-cookie, socket-handlers, webrtc-signaling)

**tests/unit/** - Unit tests (admin-auth, auth, error-handler, middleware, otp, rate-limiter, sentry, session, validation)

**tests/helpers/mocks.js** - Test mocks (Socket.IO, Redis, Telegram)

**tests/setup/jest.setup.js** - Jest global setup

**tests/jest.setup.js** - Jest config

---

### 📦 __mocks__/

**__mocks__/@sentry/node.js** - Sentry mock (test için)

---

### 🖼️ public/icons/

**hayday.webp** - Uygulama ikonu

**icon-192.png** - PWA icon 192x192

**icon-512.png** - PWA icon 512x512

---

## 🔄 SİSTEM AKIŞLARI

### Müşteri Bağlantı Akışı
1. index.html yükle → 2. İsim gir → 3. Socket.IO bağlan → 4. room:join emit → 5. getUserMedia → 6. RTCPeerConnection → 7. Admin katılınca negotiation → 8. SDP offer/answer → 9. ICE candidates → 10. P2P connection → 11. Video stream

### Admin Bağlantı Akışı
1. admin.html yükle → 2. Session check → 3. OTP request → 4. Telegram mesaj → 5. OTP verify → 6. Session create → 7. Panel aç → 8. Socket.IO bağlan → 9. room:join → 10. getUserMedia → 11. RTCPeerConnection → 12. Müşteri katılınca negotiation → 13. P2P connection → 14. Persistent (bağlı kalır)

### WebRTC Signaling
Müşteri: offer → Admin: answer → ICE candidates ↔ → P2P connection

### Auto-Reconnect
Connection failed → Monitor detect → ICE restart → New offer/answer → New ICE candidates → Re-established (<8s)

---

## 🔐 GÜVENLİK

- **Transport**: TLS/SSL (HTTPS + WSS), DTLS (WebRTC SRTP)
- **Auth**: Admin OTP (6 digit) + httpOnly cookie (12h)
- **Session**: AES-256 encryption, sliding expiration
- **CSRF**: Origin guard (/metrics)
- **Rate Limit**: 100 req/15min (Redis)
- **Validation**: Joi schemas (HTTP)
- **Monitoring**: Sentry (errors), Winston (logs), Prometheus (metrics)

---

## 🗺️ DOSYA HARİTASI

```
ALO/
│
├── server.js                                    # Ana sunucu - Express + Socket.IO başlatma
├── package.json                                 # NPM bağımlılıkları ve scripts
├── package-lock.json                            # NPM lock dosyası
├── .env                                         # Environment variables (local)
├── .env.example                                 # Env template
├── .gitignore                                   # Git ignore patterns
├── .dockerignore                                # Docker ignore patterns
├── Dockerfile                                   # Docker image tanımı
├── docker-compose.yml                           # Docker compose (app + redis)
├── docker-compose.turn.yml                      # TURN server docker compose
├── render.yaml                                  # Render.com deployment config
├── jest.config.js                               # Jest test configuration
├── playwright.config.js                         # Playwright E2E config
├── README.md                                    # Proje README
├── FULL-DOCUMENTATION.md                        # Bu dosya - Detaylı dokümantasyon
│
├── __mocks__/                                   # Jest mock dosyaları
│   └── @sentry/
│       └── node.js                              # Sentry mock (test için)
│
├── config/                                      # Konfigürasyon
│   └── index.js                                 # Envalid env validation
│
├── jobs/                                        # BullMQ job tanımları
│   └── telegram.js                              # Telegram notification queue
│
├── public/                                      # Frontend static dosyalar
│   │
│   ├── index.html                               # Müşteri ana sayfası
│   ├── admin.html                               # Admin panel sayfası
│   ├── 404.html                                 # 404 error sayfası
│   ├── 500.html                                 # 500 error sayfası
│   ├── test-suite.html                          # Test utilities sayfası
│   ├── manifest.json                            # PWA manifest
│   ├── service-worker.js                        # Service Worker (offline support)
│   ├── favicon.ico                              # Favicon
│   │
│   ├── css/                                     # CSS dosyaları
│   │   ├── main.css                             # Genel stiller (reset, typography, container)
│   │   ├── accessibility.css                    # Accessibility stilleri (a11y)
│   │   ├── mobile.css                           # Mobil responsive stilleri
│   │   ├── toast.css                            # Toast notification stilleri
│   │   ├── diagnostics.css                      # WebRTC diagnostics stilleri
│   │   ├── admin-panel.css                      # Admin dashboard stilleri
│   │   ├── welcome.css                          # Welcome screen stilleri
│   │   └── components/                          # Component stilleri
│   │       ├── hero.css                         # Ana sayfa stilleri (glassmorphism)
│   │       └── admin.css                        # Admin panel stilleri (3-column grid)
│   │
│   ├── js/                                      # JavaScript dosyaları
│   │   ├── webrtc.js                            # WebRTC Manager (core logic)
│   │   ├── perfect-negotiation.js               # Perfect Negotiation Pattern
│   │   ├── client.js                            # Müşteri tarafı logic
│   │   ├── connection-monitor.js                # WebRTC stats tracking
│   │   ├── helpers.js                           # Utility functions
│   │   ├── toast.js                             # Toast notification system
│   │   ├── warmup.js                            # Cold start prevention
│   │   ├── accessibility.js                     # Accessibility features
│   │   ├── queue-ui.js                          # Queue UI updates
│   │   └── tests.js                             # Frontend test utilities
│   │
│   └── icons/                                   # PWA icons
│       ├── hayday.webp                          # Uygulama ikonu
│       ├── icon-192.png                         # PWA icon 192x192
│       └── icon-512.png                         # PWA icon 512x512
│
├── routes/                                      # Express route handlers
│   └── index.js                                 # HTTP endpoints (health, metrics, admin OTP)
│
├── socket/                                      # Socket.IO handlers
│   ├── admin-auth.js                            # Admin OTP authentication
│   └── handlers.js                              # WebRTC signaling handlers
│
├── utils/                                       # Utility modülleri
│   ├── state-store.js                           # Redis state store (fallback: in-memory)
│   ├── admin-session.js                         # Admin session management (Redis)
│   ├── auth.js                                  # Authentication utilities
│   ├── error-handler.js                         # Global error handler
│   ├── logger.js                                # Winston logger
│   ├── metrics.js                               # Prometheus metrics
│   ├── middleware.js                            # Express middlewares
│   ├── origin-guard.js                          # CSRF/Origin protection
│   ├── rate-limiter.js                          # Redis-based rate limiter
│   ├── sentry.js                                # Sentry error tracking
│   ├── session.js                               # Session utilities
│   ├── telegram-bot.js                          # Telegram bot wrapper
│   ├── turn-credentials.js                      # TURN server credentials
│   └── validation.js                            # Joi validation schemas
│
└── tests/                                       # Test dosyaları
    │
    ├── jest.setup.js                            # Jest global setup
    │
    ├── e2e/                                     # End-to-end tests (Playwright)
    │   ├── admin-flow.spec.js                   # Admin flow testi
    │   ├── customer-flow.spec.js                # Müşteri flow testi
    │   ├── health-check.spec.js                 # Health check testi
    │   ├── socket-reconnect.test.js             # Socket reconnection testi
    │   └── webrtc-glare.test.js                 # WebRTC glare handling testi
    │
    ├── integration/                             # Integration tests
    │   ├── api.test.js                          # API endpoint testleri
    │   ├── config-turn.test.js                  # TURN config testleri
    │   ├── metrics-guard.test.js                # Metrics guard testleri
    │   ├── metrics-reconnect.test.js            # Reconnect metrics testleri
    │   ├── session-cookie.test.js               # Session cookie testleri
    │   ├── socket-handlers.test.js              # Socket handler testleri
    │   ├── socket.test.js                       # Socket.IO testleri
    │   └── webrtc-signaling.test.js             # WebRTC signaling testleri
    │
    ├── unit/                                    # Unit tests
    │   ├── admin-auth-advanced.test.js          # Admin auth advanced testleri
    │   ├── admin-auth-extended.test.js          # Admin auth extended testleri
    │   ├── admin-auth.test.js                   # Admin auth testleri
    │   ├── auth.test.js                         # Auth utilities testleri
    │   ├── error-handler.test.js                # Error handler testleri
    │   ├── middleware.test.js                   # Middlewares testleri
    │   ├── otp-advanced.test.js                 # OTP advanced testleri
    │   ├── otp.test.js                          # OTP testleri
    │   ├── rate-limiter-advanced.test.js        # Rate limiter advanced testleri
    │   ├── rate-limiter.test.js                 # Rate limiter testleri
    │   ├── sentry.test.js                       # Sentry testleri
    │   ├── session.test.js                      # Session testleri
    │   ├── socket-handlers-extended.test.js     # Socket handlers extended testleri
    │   ├── socket-handlers.test.js              # Socket handlers testleri
    │   └── validation.test.js                   # Validation testleri
    │
    ├── helpers/                                 # Test helpers
    │   └── mocks.js                             # Test mocks (Socket.IO, Redis, Telegram)
    │
    └── setup/                                   # Test setup
        └── jest.setup.js                        # Jest setup dosyası
```

---

**Bu dokümantasyon, AdminAra projesinin tüm dosyalarını ve işlevlerini detaylı açıklar. Herhangi bir geliştirici veya AI, bu dosyayı okuyarak projenin tam yapısını anlayabilir.**

