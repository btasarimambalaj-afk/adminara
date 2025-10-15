# 🚀 Render.com Deployment - Hızlı Başlangıç

## 1️⃣ GitHub'a Yükle (2 dakika)

```bash
# GitHub'da yeni repo oluştur: https://github.com/new
# Repo adı: adminara

# Sonra terminal'de:
git remote add origin https://github.com/KULLANICI_ADIN/adminara.git
git branch -M main
git push -u origin main
```

## 2️⃣ Render.com'a Deploy Et (3 dakika)

### Adım 1: Render'a Git

https://render.com → **Sign Up** (GitHub ile giriş yap)

### Adım 2: Web Service Oluştur

1. **Dashboard** → **New +** → **Web Service**
2. **Connect Repository** → `adminara` seç
3. **Ayarları kontrol et**:
   - Name: `adminara`
   - Region: `Frankfurt (EU Central)`
   - Branch: `main`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

### Adım 3: Environment Variables

Render otomatik `SESSION_SECRET` ve `COOKIE_SECRET` oluşturacak (render.yaml'da tanımlı).

**Opsiyonel** (şimdilik gerek yok):

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `TURN_SERVER_URL`
- `TURN_USERNAME`
- `TURN_CREDENTIAL`

### Adım 4: Deploy

**Create Web Service** → Deploy başlayacak (5-10 dakika)

## 3️⃣ Test Et (1 dakika)

Deploy tamamlandığında:

```bash
# URL: https://adminara.onrender.com

# Health check
curl https://adminara.onrender.com/health

# Tarayıcıda aç
https://adminara.onrender.com          # Müşteri
https://adminara.onrender.com/admin    # Admin
```

## 4️⃣ İlk Bağlantı Testi

1. **Müşteri sayfası** aç: https://adminara.onrender.com
2. **Admin sayfası** aç (yeni sekme): https://adminara.onrender.com/admin
3. Her iki tarafta **"Bağlan"** tıkla
4. Video/ses çalışıyor mu kontrol et ✅

## 🎉 Tamamlandı!

Sistem şimdi canlı: https://adminara.onrender.com

### Önemli Notlar:

- ✅ **Free tier** kullanıyorsun ($0/ay)
- ⚠️ **15 dakika** inactivity sonrası sleep (ilk istek 30-60s sürer)
- ✅ **Auto-deploy**: GitHub'a push → Otomatik deploy
- ✅ **HTTPS**: Otomatik SSL sertifikası

### Güncelleme:

```bash
# Kod değişikliği yap
git add .
git commit -m "Update message"
git push

# Render otomatik deploy edecek
```

### Monitoring:

- **Dashboard**: https://dashboard.render.com
- **Logs**: Dashboard → adminara → Logs
- **Metrics**: Dashboard → adminara → Metrics

---

**Sorun mu var?** DEPLOYMENT-GUIDE.md'ye bak (detaylı troubleshooting)
