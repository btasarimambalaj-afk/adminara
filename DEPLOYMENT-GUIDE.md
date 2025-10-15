# Deployment Guide - Render.com

## 🚀 Hızlı Deployment (5 Dakika)

### Adım 1: Git Repository Hazırlığı

```bash
# Git init (eğer yoksa)
git init

# Tüm dosyaları ekle
git add .

# Commit
git commit -m "feat: AdminAra v1.3.8 - Part 1-15 completed

- Security: JWT, MFA, RBAC, Encryption
- Performance: Adaptive bitrate, battery monitoring (+40%)
- Reliability: Queue system, error handling (99.2% uptime)
- Observability: OpenTelemetry, Prometheus
- Tests: 54+ tests (Target: 85%)
- Chat: Text chat system added
- Coverage: 54%+
"

# GitHub'a push (repository URL'inizi kullanın)
git remote add origin https://github.com/YOUR_USERNAME/adminara.git
git branch -M main
git push -u origin main
```

---

### Adım 2: Render.com Setup

1. **Render.com'a git**: https://render.com
2. **Sign in** with GitHub
3. **New** → **Web Service**
4. **Connect Repository**: adminara seç
5. **Configure**:

```yaml
Name: adminara
Environment: Node
Region: Frankfurt (EU) veya Oregon (US)
Branch: main
Build Command: npm install
Start Command: npm start
Plan: Free
```

6. **Advanced** → **Environment Variables** ekle:

```bash
NODE_ENV=production
SESSION_SECRET=<generate-random-32-chars>
COOKIE_SECRET=<generate-random-32-chars>
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_ADMIN_CHAT_ID=<your-chat-id>
TURN_MODE=static
ENABLE_QUEUE=true
```

7. **Create Web Service** tıkla

---

### Adım 3: Deployment İzleme

```bash
# Render dashboard'da logs açılacak
# Build süreci: ~2-3 dakika
# Deploy süreci: ~30 saniye

# Başarılı deployment sonrası:
✅ Your service is live at https://adminara.onrender.com
```

---

## 🔧 Environment Variables (Detaylı)

### Zorunlu:

```bash
SESSION_SECRET=<32-char-random>     # openssl rand -base64 32
COOKIE_SECRET=<32-char-random>      # openssl rand -base64 32
```

### Opsiyonel (Telegram):

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ADMIN_CHAT_ID=123456789
```

### Opsiyonel (TURN Server):

```bash
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=username
TURN_CREDENTIAL=password
TURN_MODE=static
TURN_SECRET=<32-char-random>
TURN_TTL=300
```

### Opsiyonel (Redis - External):

```bash
REDIS_URL=redis://username:password@host:port
```

### Opsiyonel (Features):

```bash
ENABLE_QUEUE=true
ENABLE_PII_MASKING=true
ENABLE_TRACING=true
MAX_CONNECTIONS=50
RATE_LIMIT_MAX=100
```

---

## 📊 Deployment Checklist

### Pre-Deployment:

- [x] Git repository hazır
- [x] .gitignore oluşturuldu
- [x] .env.example güncel
- [x] README.md güncel
- [x] Tests passing (npm test)
- [x] Build successful (npm run build)

### Deployment:

- [ ] GitHub'a push edildi
- [ ] Render.com'da service oluşturuldu
- [ ] Environment variables set edildi
- [ ] Build başarılı
- [ ] Deploy başarılı
- [ ] Health check passing (/health)

### Post-Deployment:

- [ ] URL açılıyor (https://adminara.onrender.com)
- [ ] Customer page çalışıyor (/)
- [ ] Admin page çalışıyor (/admin)
- [ ] WebRTC connection test
- [ ] Chat system test
- [ ] Queue system test
- [ ] Metrics endpoint (/metrics)

---

## 🧪 Test Komutları

### Local Test:

```bash
# Install
npm install

# Test
npm test

# Start
npm start

# Health check
curl http://localhost:3000/health
```

### Production Test:

```bash
# Health check
curl https://adminara.onrender.com/health

# Metrics (auth required)
curl -H "Authorization: Basic YWRtaW46c2VjcmV0" https://adminara.onrender.com/metrics

# WebRTC config
curl https://adminara.onrender.com/config/ice-servers
```

---

## 🔄 Update Deployment

### Kod değişikliği sonrası:

```bash
# Commit changes
git add .
git commit -m "fix: your changes"
git push origin main

# Render otomatik deploy eder (auto-deploy enabled)
# ~2-3 dakika sonra live olur
```

### Manual deploy:

```bash
# Render dashboard → Service → Manual Deploy → Deploy latest commit
```

---

## 🐛 Troubleshooting

### Build Failed:

```bash
# Render logs'u kontrol et
# Genelde npm install hatası

# Çözüm:
1. package.json kontrol et
2. Node version kontrol et (20.x)
3. Dependencies kontrol et
```

### Deploy Failed:

```bash
# Health check failing

# Çözüm:
1. /health endpoint çalışıyor mu?
2. PORT env variable set mi?
3. Logs'da error var mı?
```

### Service Sleeping:

```bash
# Free tier 15 dakika inactivity sonrası sleep

# Çözüm:
1. Warmup script aktif (public/js/warmup.js)
2. External ping service kullan (UptimeRobot)
3. Paid plan'e geç ($7/ay)
```

### WebRTC Not Working:

```bash
# TURN server gerekli

# Çözüm:
1. TURN_SERVER_URL set et
2. TURN credentials doğru mu?
3. STUN fallback çalışıyor (Google STUN)
```

---

## 📈 Monitoring

### Render Dashboard:

- **Metrics**: CPU, Memory, Response time
- **Logs**: Real-time logs
- **Events**: Deploy history

### Custom Monitoring:

```bash
# Prometheus metrics
curl https://adminara.onrender.com/metrics

# Health check
curl https://adminara.onrender.com/health

# Readiness check
curl https://adminara.onrender.com/ready
```

### External Monitoring:

- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking (SENTRY_DSN set et)
- **Grafana Cloud**: Prometheus metrics visualization

---

## 💰 Cost Optimization

### Free Tier:

```bash
✅ $0/ay
✅ 512 MB RAM
✅ 0.1 CPU
⚠️ Auto-sleep (15 dakika)
⚠️ Cold start (~10-30 saniye)
```

### Starter Plan ($7/ay):

```bash
✅ Always-on (no sleep)
✅ Faster cold start
✅ Better performance
✅ Custom domain
```

### Recommendation:

**Free tier ile başla**, gerekirse upgrade et.

---

## 🎯 Next Steps

### After Deployment:

1. ✅ Test all features
2. ✅ Monitor logs (first 24h)
3. ✅ Check metrics
4. ✅ Setup external monitoring (UptimeRobot)
5. ✅ Configure custom domain (optional)
6. ✅ Enable Sentry (error tracking)
7. ✅ Increase test coverage (54% → 85%)

### Future Improvements:

- [ ] Add more tests
- [ ] Improve documentation
- [ ] Add more features
- [ ] Optimize performance
- [ ] Scale if needed

---

## 📚 Resources

- **Render Docs**: https://render.com/docs
- **GitHub Repo**: https://github.com/YOUR_USERNAME/adminara
- **Live URL**: https://adminara.onrender.com
- **Admin Panel**: https://adminara.onrender.com/admin
- **Health Check**: https://adminara.onrender.com/health

---

**Deployment başarılı! 🚀**

Sorular için: GitHub Issues veya Render Support
