# Düzeltmeler

Buraya düzeltmeleri yazın, ben uygulayacağım.

## Format:

```
Dosya: path/to/file.js
Satır: 123
Değişiklik: Ne yapılacak
```

veya

```
Yeni özellik: Açıklama
```

---

# 1:1 Destek Yapısı – İyileştirme ve Çözümler

Bu doküman, mevcut tek-instanslı **1’e 1 canlı destek** mimarisi için tespit edilen riskleri azaltmak ve üretim dayanıklılığını artırmak amacıyla önerilen geliştirmeleri içeren ayrıntılı bir yol haritası sunar. Her bölüm, mevcut durumun özetini, hedeflenen iyileştirmeyi, önerilen tasarım kararlarını, örnek kodları ve uygulanabilirlik adımlarını içerir.

---

## Bölüm 1 – Yatay Ölçekleme İçin Redis Tabanlı Durum Katmanı

**Sorun:** `server.js:171` üzerinde tutulan `state` nesnesi (admin socket, müşteri socket’leri, OTP mağazası vb.) in-memory olduğu için uygulama tek instans ile sınırlı kalır. Çoklu instans dağıtımda oturumlar ve OTP’ler senkronize edilemez.

### Hedef
- Admin/müşteri bağlantı durumunu, OTP kodlarını ve kilitleri paylaşılabilir bir veri mağazasında tutarak N instans ölçeklemeye izin vermek.
- İn-memory bağımlılıkları azaltıp süreç restart’larında veri kaybını önlemek.

### Tasarım Kararları
1. **Redis** tercih edilir (hız, TTL desteği, publish/subscribe).
2. OTP ve session verileri için **hash / key-value** yaklaşımı, müşteri kuyruğu ve bağlantı sayacı için **sorted set / counter** kullanılır.
3. Socket.IO’nun çoklu instans desteği için `socket.io-redis-adapter` veya `@socket.io/redis-adapter` devreye alınır.

### Örnek Env Ayarları
```ini
# .env.production
REDIS_URL=redis://primary-redis:6379
REDIS_NAMESPACE=hayday-support
STATE_TTL_SECS=3600
```

### Kod Taslağı (Redis İstemcisi ve State Katmanı)
```js
// utils/state-store.js
const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', (err) => logger.error('Redis error', { err: err.message }));

async function init() {
  if (!client.isOpen) {
    await client.connect();
  }
}

function key(name) {
  return `${process.env.REDIS_NAMESPACE || 'support'}:${name}`;
}

module.exports = {
  init,
  async incrementConnectionCount() {
    return client.incr(key('connectionCount'));
  },
  async decrementConnectionCount() {
    return client.decr(key('connectionCount'));
  },
  async setAdminSocket(id) {
    await client.set(key('adminSocket'), id, { EX: process.env.STATE_TTL_SECS || 3600 });
  },
  async getAdminSocket() {
    return client.get(key('adminSocket'));
  },
  async addCustomerSocket(id, payload) {
    await client.hSet(key('customerSockets'), id, JSON.stringify(payload));
  },
  async removeCustomerSocket(id) {
    await client.hDel(key('customerSockets'), id);
  },
  async listCustomerSockets() {
    const data = await client.hGetAll(key('customerSockets'));
    return Object.entries(data).map(([id, json]) => ({ id, ...JSON.parse(json) }));
  },
  async storeOtp(adminId, otp, ttlMs) {
    await client.set(key(`otp:${adminId}`), otp, { PX: ttlMs });
  },
  async consumeOtp(adminId) {
    const val = await client.getDel(key(`otp:${adminId}`));
    return val;
  },
};
```

### Socket.IO Redis Adapter Örneği
```js
// server.js (setup bölümünde)
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### Uygulama Adımları
1. Redis’i kurup erişim bilgilerini `.env` dosyalarına ekleyin.
2. `utils/state-store.js` gibi yeni bir katman oluşturup `state` yönetimini bu katmana yönlendirin.
3. Admin ve müşteri socket bağlama noktalarında Redis verilerini güncelleyin (örn. `socket/handlers.js:83` → `stateStore.addCustomerSocket`).
4. OTP üretim/validasyon işlevlerini Redis’e taşıyın (bkz. Bölüm 2).
5. Socket.IO adapter’ı aktive edin ve çoklu instans testini (2 node) yük testiyle doğrulayın.
6. Redis kesintisi durumunda graceful fallback (örn. “destek geçici olarak kullanılamıyor”) için hata yakalama ekleyin.

---

## Bölüm 2 – Admin Session / OTP Yönetimini Birleştirmek

**Sorun:** `utils/auth.js` ile `utils/session.js` paralel oturum modelleri kullanıyor (`socket/admin-auth.js:102`). Bu durum çakışma ve bakım maliyeti yaratıyor.

### Hedef
- Tek bir session katmanı üzerinden hem socket hem HTTP tarafındaki doğrulamayı yürütün.
- Prototipleme için kullanılan konsol log’larını kaldırıp güvenli saklama ve revoke mekanizmalarını merkezi hale getirin.

### Tek Katmanlı Session Modülü (Redis Destekli)
```js
// utils/admin-session.js
const crypto = require('crypto');
const store = require('./state-store');

const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '43200000', 10); // 12h

async function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('hex');
  await store.storeSession(token, adminId, SESSION_TTL_MS);
  return token;
}

async function validateSession(token) {
  return store.readSession(token);
}

async function revokeSession(token) {
  await store.deleteSession(token);
}

module.exports = {
  createSession,
  validateSession,
  revokeSession,
  SESSION_TTL_MS,
};
```

```js
// utils/state-store.js (devam)
async function storeSession(token, adminId, ttlMs) {
  await client.set(key(`session:${token}`), adminId, { PX: ttlMs });
}

async function readSession(token) {
  const adminId = await client.get(key(`session:${token}`));
  if (!adminId) return null;
  await client.pExpire(key(`session:${token}`), SESSION_TTL_MS); // kaydırma
  return { adminId };
}

async function deleteSession(token) {
  await client.del(key(`session:${token}`));
}
```

### Admin Auth’un Güncellenmesi
```js
// socket/admin-auth.js
const adminSession = require('../utils/admin-session');

socket.on('admin:session:verify', async ({ token }) => {
  if (!token) return socket.emit('admin:session:invalid');
  const session = await adminSession.validateSession(token);
  if (!session) return socket.emit('admin:session:invalid');
  socket.emit('admin:session:valid');
  socket.handleRoomJoin?.(socket, { isAdmin: true, adminId: session.adminId });
});

socket.on('admin:password:verify', async ({ password }) => {
  // OTP doğrulama...
  const token = await adminSession.createSession('admin'); // adminId parametreli
  socket.emit('admin:password:verified', { token });
});
```

```js
// server.js (HTTP oturumu)
const adminSession = require('./utils/admin-session');

function setSessionCookie(res, token, ttlMs = adminSession.SESSION_TTL_MS) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Host-adminSession' : 'adminSession';
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Strict',
    maxAge: ttlMs,
    path: '/',
  });
}
```

### Adım Dizisi
1. `utils/session.js` ve `utils/auth.js` fonksiyonlarını `utils/admin-session.js` altında yeniden toplayın.
2. Tüm çağrıları (socket, HTTP rotaları) yeni modüle yönlendirin.
3. Kod temizlik: eski modülleri kaldırın, testleri (`tests/unit/session.test.js`) güncelleyin.
4. Telegram OTP üretimi ile session yaratımı arasında tutarlılık sağlaması için adminId parametresini modüler hale getirin.

---

## Bölüm 3 – Konfigüre Edilebilir Origin ve CORS Politikaları

**Sorun:** `server.js:200` üzerindeki `allowedOrigins` listesi statik. Yeni ortamlar devreye alındığında manuel kod değişikliği gerekiyor, hata riski artıyor.

### Çözüm
- Hem CORS hem Metrics guard whitelist’lerini `.env` üzerinden yönetilebilir hale getirin.

### Örnek Env Yapısı
```ini
ALLOWED_ORIGINS=https://adminara.onrender.com,http://localhost:3000,https://staging.adminara.com
ALLOWED_METRICS_ORIGINS=https://adminara.onrender.com,https://ops.adminara.com
```

### Kod Taslağı
```js
// utils/origin-guard.js
function buildOriginSet(envVar, defaults = []) {
  return (process.env[envVar] || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .concat(defaults);
}

const corsWhitelist = buildOriginSet('ALLOWED_ORIGINS');
const metricsWhitelist = buildOriginSet('ALLOWED_METRICS_ORIGINS', [
  process.env.PUBLIC_URL,
  'http://localhost:3000',
]);

function isAllowed(origin, whitelist) {
  if (!origin) return true;
  return whitelist.some((allowed) => origin.startsWith(allowed));
}

module.exports = {
  corsWhitelist,
  metricsWhitelist,
  isAllowed,
};
```

```js
// server.js (CORS yapılandırması)
const originGuard = require('./utils/origin-guard');

const corsOptions = {
  origin(origin, callback) {
    return originGuard.isAllowed(origin, originGuard.corsWhitelist)
      ? callback(null, origin)
      : callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
};
```

```js
// server.js (metrics guard)
function metricsOriginGuard(req, res, next) {
  const origin = String(req.headers.origin || '');
  const referer = String(req.headers.referer || '');
  const whitelist = originGuard.metricsWhitelist;

  if (!originGuard.isAllowed(origin, whitelist) && !originGuard.isAllowed(referer, whitelist)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}
```

### Doğrulama
- Jest üzerinden whitelist testi yazın (`tests/unit/origin-guard.test.js`).
- Staging/production ortamlarında env listelerini güncelleyerek canary deploy ile doğrulayın.

---

## Bölüm 4 – 1’e 1 Destek İçin Kuyruklama ve Kapasite Modeli

**Sorun:** `customerSockets` sadece tek müşteri socket’i kabul ediyor (`socket/handlers.js:83`). Trafik arttığında bekleyen kullanıcılar ayrılıyor; deneyim kötüleşiyor.

### Hedef
- 1’e 1 destek kuralını korurken (övmez) **bekleyen müşteriler için FIFO kuyruğu** ekleyerek bekleme sürelerini yönetmek.
- Maksimum bekleme süresi ve bildirim mekanizmalarını devreye almak.

### Tasarım
1. `state-store` içinde `waitingQueue` (Redis listesi) tutun.
2. Admin müsait olduğunda sıradaki müşteriyi otomatik olarak odaya dahil edin.
3. Müşteri reddedildiğinde (max kapasite) bilgilendirici mesaj ve tahmini süre gösterin.

### Kod Taslağı
```js
// utils/state-store.js
async function enqueueCustomer(socketId, payload) {
  await client.rPush(key('queue'), JSON.stringify({ socketId, ...payload }));
}

async function dequeueCustomer() {
  const item = await client.lPop(key('queue'));
  return item ? JSON.parse(item) : null;
}

async function queueLength() {
  return client.lLen(key('queue'));
}
```

```js
// socket/handlers.js (room join akışı)
if (!isAdmin) {
  const activeCustomerCount = await stateStore.activeCustomerCount();
  if (activeCustomerCount >= 1) {
    await stateStore.enqueueCustomer(socket.id, { customerName: name });
    const position = await stateStore.queueLength();
    socket.emit('queue:joined', { position });
    logger.info('Customer queued', { socketId: socket.id, position });
    return;
  }
  await stateStore.setActiveCustomer(socket.id, { name });
  // devam...
}
```

```js
// Admin disconnect / call end
const nextCustomer = await stateStore.dequeueCustomer();
if (nextCustomer) {
  const queuedSocket = io.sockets.sockets.get(nextCustomer.socketId);
  if (queuedSocket) {
    queuedSocket.emit('queue:ready');
    handleRoomJoin(queuedSocket, { isAdmin: false, customerName: nextCustomer.customerName });
  }
}
```

### UI Güncellemeleri
- `public/js/client.js` içerisinde `queue:joined` ve `queue:ready` event’lerini dinleyin:
```js
this.socket.on('queue:joined', ({ position }) => {
  this.showQueuePosition(position);
});

this.socket.on('queue:ready', () => {
  this.joinChannelImmediately();
});
```

### Test Planı
1. Unit test: Kuyruğa ekleme/çıkarma sırasını doğrulayın.
2. Integration test: İki müşteri socket’i ile admin yokken birinin sıraya girmesi, admin bağlanınca kuyruğun boşalması.
3. Load test: 100 eşleşme simülasyonu → bağlantı sayacı ve Redis listesi tutarlılık kontrolü.

---

## Bölüm 5 – Telegram Bildirimlerinde Dayanıklılık

**Sorun:** `socket/handlers.js:105` üzerinde Telegram API çağrısı başarısız olursa yeniden deneme yapılmıyor. Ağ kesintilerinde alarm üretilemeyebilir.

### Hedef
- Telegram mesaj gönderimlerini retry/backoff ve kalıcı kuyruğa bağlamak.
- Hata senaryosunda admin’e alternatif iletişim (örn. e-posta) tetiklemek.

### Çözüm Bileşenleri
1. **Görev Kuyruğu:** Redis `stream` veya `bullmq` kullanarak mesajları kuyruklayın.
2. **Worker Proses:** Kuyruktan mesajları alıp Telegram API’sine gönderir, hata durumunda exponential backoff uygular.
3. **Fallback:** Belirli deneme sayısından sonra Slack/e-posta fallback webhook’u tetikleyin.

### Kod Taslağı (BullMQ Kullanarak)
```js
// jobs/telegram.js
const { Queue, Worker } = require('bullmq');

const queue = new Queue('telegramNotifications', {
  connection: { url: process.env.REDIS_URL },
});

async function enqueueTelegramMessage(payload) {
  await queue.add('sendTelegram', payload, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

new Worker('telegramNotifications', async (job) => {
  const bot = require('../utils/telegram-bot');
  await bot.sendMessage(job.data.chatId, job.data.text);
}, {
  connection: { url: process.env.REDIS_URL },
  limiter: { max: 5, duration: 1000 }, // API rate limit
});

module.exports = {
  enqueueTelegramMessage,
};
```

```js
// utils/telegram-bot.js
const TelegramBot = require('node-telegram-bot-api');

const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

async function sendMessage(chatId, text) {
  if (!bot) throw new Error('Telegram bot not configured');
  return bot.sendMessage(chatId, text);
}

module.exports = { sendMessage };
```

```js
// socket/handlers.js (bildirim çağrısı)
const { enqueueTelegramMessage } = require('../jobs/telegram');

if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
  await enqueueTelegramMessage({
    chatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    text: `🔔 Yeni müşteri sırada!\n👤 ${name}\n⏰ ${new Date().toLocaleTimeString('tr-TR')}`,
  });
}
```

### İzleme
- Job başarısızlıklarını Prometheus’a aktarın (`jobs_failed_total` counter).
- Slack veya e-posta fallback kancası ekleyin:
```js
queue.on('failed', (job, err) => {
  logger.error('Telegram job failed', { jobId: job.id, err: err.message });
  if (job.attemptsMade >= job.opts.attempts) {
    triggerFallbackNotification(job.data);
  }
});
```

---

## Bölüm 6 – Doğrulama ve Devreye Alma Stratejisi

### 1. Birim ve Entegrasyon Testleri
- Redis state store için izolasyonlu testler (`ioredis-mock` kullanılarak).
- Kuyruk senaryoları ve Telegram job queue testleri.
- Origin guard ve CORS whitelist kombinasyonları için Jest.

### 2. Gözlemleme
- `socket_connections_total`, `queue_length`, `telegram_jobs_failed_total` gibi yeni metrikleri Prometheus’a ekleyin.
- Redis bağlantı hatalarını Sentry’de yakalayın.

### 3. Aşamalı Yayın
1. **Staging**: Tek instans → Redis → Kuyruk → Telegram worker sırasıyla doğrulanır.
2. **Canary**: İki instans ile socket broadcast tutarlılığı test edilir (Socket.IO Redis adapter).
3. **Tam Yayın**: Trafik yönlendirme sonrası metrikler izlenir, geri alma planı hazır tutulur.

### 4. Rollback Planı
- Redis kesilirse uygulama “bakım modu”na geçip yeni müşteri kabul etmeyecek şekilde fail-fast mekanizması ekleyin.
- Kuyruk sistemi devre dışı bırakılabilir feature flag ile yönetilsin (örn. `ENABLE_QUEUE=false`).

---

## Özet

Bu plan, **1’e 1 destek** senaryosuna odaklanan mevcut sistemi ölçeklenebilir, güvenli ve dayanıklı hale getirmek için gerekli yapı taşlarını detaylandırır:
- Paylaşımlı Redis state ile yatay ölçek.
- Konsolide admin session yönetimi.
- Konfigüre edilebilir güvenlik katmanları (CORS/metrik guard).
- Müşteri kuyruğu ile kontrollü kapasite.
- Telegram bildirimlerinin dayanıklı kuyruğa alınması.

Uygulama sırasındaki her adım, testler ve gözlemleme ile doğrulanmalı; gerektiğinde devre dışı bırakılabilecek feature flag’ler kullanılmalıdır. Bu sayede 1’e 1 destek deneyimi hem müşteri hem de admin açısından kesintisiz ve tutarlı kalacaktır.

---

## Ek Geliştirmeler

### Bölüm 7 – Paylaşımlı Rate Limiter ve Lock Mekanizmaları

**Sorun:** `utils/rate-limiter.js:4` içindeki `requests` ve `locks` Map’leri in-memory. Çoklu instans dağıtımda OTP deneme limitleri ve lock bilgileri tutarsız kalır.

#### Hedef
- Tüm rate limit ve lock kayıtlarını Redis üzerinde saklayarak instanslar arasında eşgüdümlü hale getirmek.
- Lock bilgilerini metriklere yansıtıp operasyonel görünürlük sağlamak.

#### Kod Taslağı
```js
// utils/rate-limiter.js (Redis tabanlı)
const store = require('./state-store');

async function isLimited(key, limit, windowMs) {
  const counterKey = `rate:${key}`;
  const current = await store.incrWithExpiry(counterKey, windowMs);
  if (current > limit) {
    const ttl = await store.ttl(counterKey);
    return { limited: true, retryAfter: ttl, reason: 'rate_limit' };
  }
  return { limited: false };
}

async function lockout(key, durationMs, reason = 'failed_attempts') {
  await store.setWithExpiry(`lock:${key}`, reason, durationMs);
  logger.warn('Rate limiter lockout', { key: store.maskKey(key), reason, durationMs });
}
```

```js
// utils/state-store.js
async function incrWithExpiry(keyName, windowMs) {
  const fullKey = key(keyName);
  const value = await client.incr(fullKey);
  if (value === 1) {
    await client.pExpire(fullKey, windowMs);
  }
  return value;
}

async function setWithExpiry(keyName, value, ttlMs) {
  await client.set(key(keyName), value, { PX: ttlMs });
}

async function ttl(keyName) {
  return client.pttl(key(keyName));
}
```

#### Test ve Doğrulama
- `rate-limiter-advanced.test.js`’i Redis taklitçisi ile güncelleyin.
- Uygulamada rate limit devre dışı kalırsa fallback davranışını (ör. “çevrim içi sıra dolu”) belirleyin.

---

### Bölüm 8 – HTTP Girdi Doğrulaması ve Şema Yönetimi

**Sorun:** `/admin/otp/request`, `/admin/otp/verify` gibi HTTP POST uç noktaları raw body’yi doğrulamadan kabul ediyor (`server.js:250`). `utils/validation.js` yalnızca Socket.IO mesajları için kullanılıyor.

#### Hedef
- Tüm HTTP isteklerinin merkezi şema doğrulamasından geçmesi.
- Konfigürasyon hatalarını erken yakalamak için uygulama başlatma aşamasında env şema doğrulaması yapmak.

#### Önerilen Yaklaşım
1. **Celebrate/Joi** veya `joi` tabanlı Express middleware kullanın:
   ```js
   const { celebrate, Joi, errors } = require('celebrate');

   app.post('/admin/otp/request', celebrate({
     body: Joi.object({ adminId: Joi.string().trim().max(64).default('admin') }),
   }), (req, res) => { ... });

   app.use(errors());
   ```
2. `.env` dosyaları için `envalid` / `joi` ile konfigürasyon şeması oluşturun:
   ```js
   const env = envalid.cleanEnv(process.env, {
     NODE_ENV: envalid.str({ choices: ['development', 'staging', 'production'] }),
     COOKIE_SECRET: envalid.str(),
     TELEGRAM_BOT_TOKEN: envalid.str({ default: '' }),
     // ...
   });
   ```
3. Konfigürasyon nesnesini `config/index.js` altında toplayın ve tüm kodda doğrudan `process.env` erişimini azaltın.

---

### Bölüm 9 – Güvenlik Sertleşmesi ve Proxy Farkındalığı

**Eksik Noktalar:**
- Üretimde `COOKIE_SECRET` env’si verilmezse fallback olarak `'dev-secret'` kullanılıyor (`server.js:15`). Bu durum cookie imzalamayı zayıflatır.
- `app.use(helmet(...))` içerisinde `'unsafe-inline'` script/style izinleri CSP’yi gevşetiyor.
- Proxy arkasında gerçek IP okumak için `app.enable('trust proxy')` çağrısı yapılmamış; IP whitelist ve HTTPS yönlendirme `x-forwarded-*` başlıklarına güveniyor (`server.js:120`, `socket/admin-auth.js:37`).

#### Hedef
- Üretimde kritik env değerlerini zorunlu kılmak, CSP’yi sıkılaştırmak ve proxy farkındalığı sağlamak.

#### Öneriler
1. Uygulama başlangıcında kritik env kontrolleri:
   ```js
   if (process.env.NODE_ENV === 'production' && !process.env.COOKIE_SECRET) {
     throw new Error('COOKIE_SECRET is required in production');
   }
   ```
2. Helmet için nonce tabanlı CSP:
   ```js
   app.use((req, res, next) => {
     res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
     next();
   });
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
         styleSrc: ["'self'"],
         // ...
       },
     },
   }));
   ```
3. Express proxy ayarı:
   ```js
   app.enable('trust proxy');
   ```
   Böylece IP whitelist ve HTTPS yönlendirme doğru başlıklarla çalışır.
4. Admin OTP mesajlarında üretimde URL’leri whitelist’ten seçin, hard-coded `localhost` fallback’i kaldırın.

---

### Bölüm 10 – Gözlemlenebilirlik ve Operasyonel Hazırlık

**Sorunlar:**
- Loglar yalnızca dosya/console’a yazılıyor (`utils/logger.js:4`); merkezi log toplama yok.
- WebRTC işlevleri için uçtan uca SLO/SLA tanımlı değil; çağrı başarısızlık oranı veya gecikme metrikleri eksik.
- Çalışma süresi boyunca kritik görevler (Telegram job queue, Redis bağlantısı) için canlılık uyarıları yok.

#### İyileştirme Adımları
1. **Log Shipping:** Winston’a `winston-daily-rotate-file` veya ELK/Splunk entegrasyonu ekleyin; JSON loglarına `requestId`, `sessionId` gibi korelasyon alanları ekleyin.
2. **Ek Prometheus Metrikleri:**
   ```js
   const callSuccessRatio = new client.Gauge({
     name: 'webrtc_call_success_ratio',
     help: 'Successful call ratio (0-1)',
   });
   const queueLength = new client.Gauge({
     name: 'support_queue_length',
     help: 'Current waiting queue length',
   });
   ```
   Kuyruk ve job worker içinde bu değerleri güncelleyin.
3. **Sağlık Kontrolleri:** `/health` cevabına Redis, Telegram queue ve Socket.IO adapter durumunu ekleyin:
   ```js
   redis: await store.isHealthy(),
   queue: await telegramQueue.isHealthy(),
   ```
4. **Alarm ve Runbook:** SRE runbook’una (docs/SRE-RUNBOOKS.md) Redis kopması, queue tıkanması, Telegram job başarısızlığı için bakım adımları ekleyin.

---

### Bölüm 11 – Test ve CI/CD Geliştirmeleri

**Gözlemler:**
- Jest testleri kapsamlı; ancak Redis, BullMQ ve yeni kuyruğa dair testler henüz yok.
- Playwright e2e testleri mevcut fakat CI pipeline’ında (GitHub Actions) kısa koşu seçeneği belirtilmemiş.

#### Öneriler
1. **Redis Mock Testleri:** `ioredis-mock` veya `redis-memory-server` kullanarak state store testleri yazın.
2. **BullMQ Worker Testleri:** Worker fonksiyonlarını izole edip job retry senaryolarını test edin.
3. **CI Pipeline Güncellemesi:**
   - Redis servisinin docker-compose ile ayağa kalkması.
   - Playwright için `npx playwright install --with-deps` ve `npx playwright test --project=chromium`.
   - Coverage raporunu `lcov` olarak upload edin.
4. **Load/Chaos Testleri:** K6 veya Artillery ile WebRTC sinyalleşme yük testi; Redis bağlantısı kesildiğinde beklenen fallback davranışının doğrulanması için chaos senaryosu ekleyin.

---

### Bölüm 12 – Ürün ve Deneyim Seviyesinde İyileştirme Notları

1. **Müşteri Kuyruk Bildirimi:** Kuyrukta bekleyen müşterilere tahmini bekleme süresi ve sıradaki kullanıcı sayısı gösterin.
2. **Admin Panel Geliştirmesi:** Hangi müşteri ile görüşüldüğü, kaç dakikadır konuşulduğu ve sırada kimlerin olduğu admin panelinde listelenebilir.
3. **Audit Trail:** Session/token kullanımları için denetim kaydı tutarak güvenlik incelemelerini kolaylaştırın (Redis stream veya ayrı bir log).
4. **Konfigürasyon Yönetimi:** Farklı ortamlar için `.env` yerine merkezi bir config hizmeti (örn. HashiCorp Vault, AWS Parameter Store) değerlendirin; Telegram token gibi sırları kod tabanından ayırın.

---

### Bölüm 13 – WebRTC Ses/Görüntü Aktarımında “Sıfır Kopma” Hedefi

1’e 1 destek deneyiminde ses/görüntü aktarımındaki kopmaları en aza indirmek için ağ dayanıklılığı, medya optimizasyonu ve arayüz geri bildirimi katmanlarında geliştirilmeler yapılmalıdır.

#### 13.1 Ağ Dayanıklılığı ve ICE Yönetimi

- **Çoklu TURN Havuzu:** Birden fazla region’da TURN sunucusu tanımlayıp `RTCPeerConnection` konfigürasyonunda önceliklendirin:
  ```json
  [
    { "urls": "turn:turn-eu1.example.com", "username": "...", "credential": "...", "priority": 1 },
    { "urls": "turn:turn-us1.example.com", "username": "...", "credential": "...", "priority": 2 }
  ]
  ```
  Redis tabanlı state store ile hangi müşteri hangi TURN’e bağlandı bilgisini saklayın; metrik olarak `turn_selected_region` counter’ı yayınlayın.

- **ICE Restart & Connectivity Checks:** `public/js/webrtc.js` içinde bağlantı düşerse otomatik ICE restart başlatın:
  ```js
  async handleConnectionFailure() {
    if (!this.peerConnection) return;
    await this.peerConnection.restartIce();
    this.socket.emit('metrics:reconnect-attempt');
    this.scheduleReconnectFallback();
  }
  ```

- **Network Preflight Testi:** Admin ve müşteri girişlerinde `RTCIceTransportPolicy: 'relay'` ile kısa bir test çağrısı yapıp TURN üzerinden bağlantı kurabiliyor mu kontrol edin; başarısız olursa UI üzerinde uyarı verin.

- **QoS Önceliği:** WebRTC bağlantısında DSCP flag kullanımı için `setLocalDescription` sonrası SDP’de `a=mid:audio` satırına `a=ptime:20` ve `b=AS:128` gibi bitrate satırları ekleyin; Node tarafında UDP QoS için OS seviyesinde `tc` yapılandırması düşünün.

#### 13.2 Medya Kalitesi Optimizasyonu

- **Audio Önceliği & DTX:** Sesin kopmaması için Opus DTX ve FEC kullanın:
  ```js
  const params = sender.getParameters();
  params.encodings = params.encodings || [{}];
  params.encodings[0] = { maxBitrate: 64000, dtx: true };
  sender.setParameters(params);
  ```

- **Dinamik Codec Seçimi:** Tarayıcı destekliyorsa `mediaConstraints` içine `preferredAudioCodec: 'opus/48000/2'`, `preferredVideoCodec: 'VP9'` gibi ayarlar ekleyin. Ağ zayıfsa video akışını otomatik kapatıp sadece ses bırakın.

- **Jitter Buffer & AEC:** `navigator.mediaDevices.getUserMedia` çağrısında echo cancellation, noise suppression ve auto gain kontrolünü aktif edin:
  ```js
  { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
  ```

- **Stat Bazlı Adaptasyon:** `ConnectionMonitor`’ı genişleterek WebRTC `getStats()` içinden RTT, jitter ve packetLoss verilerine göre bitrate azaltma, ICE restart ve “yalnızca ses” moduna geçme kararları alın:
  ```js
  if (this.stats.packetLoss > 10) {
    await this.webrtcManager.forceAudioOnly();
    this.socket.emit('metrics:high-packet-loss');
  }
  ```

#### 13.3 Arayüz ve Admin Panel Geliştirmeleri

- **Canlı Bağlantı Göstergesi:** Admin panelinde müşteri RTT, packet loss, kullanılan TURN ve codec bilgilerini gösteren bir “Call Diagnostics” bölümü ekleyin. `socket/handlers.js` üzerinden periyodik olarak admin’e `call:stats` event’i yayınlayın.

- **Manuel Kurtarma Aksiyonları:** Admin arayüzüne “Bağlantıyı Yeniden Başlat”, “Sadece Sese Geç”, “Müşteriyle Sohbet Aç” gibi butonlar ekleyin. Bu butonlar WebRTC Manager üzerinde ICE restart veya medya track kapatma işlemlerini tetiklesin.

- **Müşteri Tarafı Görsel Geri Bildirim:** `public/js/client.js` içinde bağlantı kalitesi düştüğünde ekranın üst kısmında renk kodlu bar gösterin; `ConnectionMonitor` olaylarına abone olarak “Bağlantı zayıf – lütfen internetinizi kontrol edin” mesajı verin.

#### 13.4 Sunucu Tarafı Signaling İyileştirmeleri

- **Sinyal Kuyruğu:** Daha zayıf ağlarda signal paketleri kaybolmasın diye `socket/handlers.js` içerisinde `rtc:description` ve `rtc:ice:candidate` event’lerini per-socket message queue üzerinden tekrar yayınlayın; işlenmeyen mesajları tekrar deneyin.

- **Ack Mekanizması:** Socket.IO custom event acknowledgement kullanarak kritik WebRTC mesajlarının karşı tarafa ulaştığını teyit edin:
  ```js
  socket.emit('rtc:description', data, (ack) => {
    if (!ack?.ok) retrySend();
  });
  ```

- **Health Endpoint Genişletmesi:** `/health` yanıtına geçerli WebRTC oturum sayısı, ortalama RTT, failover sayısı, aktif TURN bölgeleri gibi alanları ekleyin.

#### 13.5 Alternatif Topoloji Değerlendirmesi

- **SFU Hazırlığı:** Trafik artışı veya kalite gereksinimi büyürse 1’e 1 bile olsa merkezi bir SFU (medya sunucusu) çözümlerini (Janus, Jitsi, mediasoup) değerlendirin. Bu sayede uplink/bandwidth baskısı ve NAT problemleri daha iyi yönetilir. Redis state ve signaling katmanı halihazırda hazırlandığı için SFU entegrasyonu kolaylaşır.

---

### Bölüm 14 – Hoparlör/Ses Çıkışı Yönetimi (Telefon vs. Hoparlör)

Açık alanda hoparlörle konuşma veya telefonda kulağa dayama senaryolarında kullanıcıya cihaz seçme özgürlüğü sağlamak için aşağıdaki adımlar atılmalıdır.

#### 14.1 Tarayıcı API’leri ve Destek Tespiti

- `HTMLMediaElement.setSinkId` API’si ile tarayıcı (Chrome, Edge, Safari 14+) destekliyorsa ses çıkış cihazı seçilebilir.
- Destek tespiti:
  ```js
  const audioEl = document.getElementById('remoteAudio');
  const canChangeOutput = typeof audioEl.setSinkId === 'function';
  ```
- Destek yoksa (Firefox gibi) kullanıcıya hoparlör seçiminin desteklenmediğini UI’de belirtin.

#### 14.2 Cihaz Listesi ve UI Akışı

- Müşteri ve admin arayüzlerinde bir “Ses çıkışı” seçici (dropdown) ekleyin; `navigator.mediaDevices.enumerateDevices()` ile listelenen `kind === 'audiooutput'` cihazları gösterin.
  ```js
  async function populateAudioOutputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter((d) => d.kind === 'audiooutput');
    renderOutputSelect(outputs);
  }
  ```
- Kullanıcı cihazı seçtiğinde `setSinkId` ile uygulanır:
  ```js
  async function setAudioOutput(deviceId) {
    const remoteAudio = document.getElementById('remoteAudio');
    if (remoteAudio && remoteAudio.setSinkId) {
      await remoteAudio.setSinkId(deviceId);
    }
  }
  ```
- `setSinkId` çağrısı HTTPS gerektirir ve kullanıcı etkileşimi (click) olmadan çalışmaz; UI butonu zorunludur.

#### 14.3 Mobil Özel Senaryolar

- Mobile Chrome (Android) çıkış cihazı seçimini desteklerken iOS Safari kısıtlıdır; bu durumda native benzeri deneyim için:
  - iOS’ta hoparlör moduna geçmek için `webRTCManager.toggleSpeaker()` içinde `element.setAttribute('playsinline', true); element.play();` sonrasında `navigator.mediaDevices.getUserMedia({ audio: true })` ile yeniden yetki isteyebilirsiniz.
  - Fiziksel kulaklık/BT cihazı bağlantısı `devicechange` event’i ile tespit edilip otomatik olarak `setSinkId` uygulaması denenebilir.
  - PWA modunda iOS hoparlör seçimi kısıtlı olduğundan kullanıcıya bilgilendirme mesajı gösterin.

#### 14.4 Admin Paneli İçin Özel Kontroller

- Admin panelinde gelen çağrıyı hoparlöre verme veya kulaklık modu arasında geçiş yapılabilecek butonlar ekleyin:
  ```js
  document.getElementById('speakerButton').addEventListener('click', async () => {
    await setAudioOutput(selectedDeviceId);
    logger.info('Audio output switched', { deviceId: selectedDeviceId });
  });
  ```
- Admin tarafında birden fazla hoparlör seçeneği olacağından son seçimleri `localStorage`’da saklayın ve sonraki çağrıda otomatik hatırlayın.

#### 14.5 Geri Bildirim ve Fallback

- `setSinkId` çağrısı hata dönerse (`NotAllowedError`, `SecurityError`) kullanıcıya hızlı geri bildirim verin ve varsayılan çıkışı kullanmaya devam edin.
  ```js
  try {
    await remoteAudio.setSinkId(deviceId);
  } catch (err) {
    showToast('Hoparlöre geçilemedi, varsayılan ses devam ediyor.');
  }
  ```
- Ses çıkışları değiştiğinde (`navigator.mediaDevices.ondevicechange`) menüyü güncelleyin; yeni cihaz takıldığında otomatik seçmek yerine kullanıcı onayı isteyin.

#### 14.6 Test ve Doğrulama

- **Manuel Testler:** Masaüstü Chrome’da farklı ses cihazları, mobil Android Chrome’da hoparlör/kulaklık değişimi, iOS Safari’de davranış.
- **Otomasyon:** Playwright testlerinde `page.emulateMedia` desteklenmediği için manuel doğrulama gerekir; ancak UI elementlerinin varlığı ve hata mesajlarının gösterilmesi test edilebilir.
- **Telemetri:** Hangi cihazların seçildiğini işleyen anonim metrikler toplayarak (ör. `audio_output_selection_total{device_type="speaker"}`) kullanıcı tercihlerini analiz edin.

---

Bu ek bölümler, başlangıçta tespit edilen risklerin ötesinde sistemin dayanıklılığını ve operasyonel yönetilebilirliğini artırmak için uygulanması gereken adımları kapsamaktadır. Her iyileştirme, yeni eklenen temel plan kısımlarına göre önceliklendirilerek roadmap’e alınmalıdır.
