# Dokümantasyon Kuralları

## ⚠️ ÖNEMLİ UYARI

**FULL-DOCUMENTATION.md** dosyası **ASLA SİLİNMEMELİDİR** ve **HER DEĞİŞİKLİKTE GÜNCELLENMELİDİR**.

---

## 📋 Neden Önemli?

1. **Proje Hafızası**: Tüm proje yapısını ve kararları saklar
2. **Yeni Geliştiriciler**: Hızlı onboarding için gerekli
3. **AI Entegrasyonu**: AI'ların projeyi anlaması için kritik
4. **Bakım Kolaylığı**: Hangi dosyanın ne işe yaradığını gösterir
5. **Teknik Borç Önleme**: Gereksiz dosyaları tespit eder

---

## 🔄 Güncelleme Kuralları

### Yeni Dosya Eklendiğinde

```bash
# Örnek: Yeni bir utility eklendi
# utils/cache.js

1. FULL-DOCUMENTATION.md aç
2. İlgili bölümü bul (### 🛠️ utils/)
3. Yeni dosyayı ekle:
   **utils/cache.js** - Redis cache wrapper (get, set, delete, TTL)
4. Dosya haritasına ekle:
   │   ├── cache.js                              # Redis cache wrapper
5. Commit: "Docs: cache.js eklendi"
```

### Dosya Silindiğinde

```bash
# Örnek: Eski bir dosya silindi
# utils/old-helper.js

1. FULL-DOCUMENTATION.md aç
2. İlgili satırı bul ve sil
3. Dosya haritasından da sil
4. Commit: "Docs: old-helper.js silindi"
```

### Dosya İşlevi Değiştiğinde

```bash
# Örnek: webrtc.js'e yeni özellik eklendi

1. FULL-DOCUMENTATION.md aç
2. İlgili açıklamayı bul
3. Yeni özelliği ekle:
   **webrtc.js** - WebRTC Manager class (..., handleDataChannel)
4. Commit: "Docs: webrtc.js data channel eklendi"
```

### Version Değiştiğinde

```bash
# Örnek: Version 1.3.6 → 1.3.7

1. FULL-DOCUMENTATION.md aç
2. Üstteki version'ı güncelle:
   **Version**: 1.3.7
3. package.json'da da güncelle
4. Commit: "Version: 1.3.7"
```

---

## 📝 Güncelleme Checklist

Her değişiklikten sonra kontrol et:

- [ ] FULL-DOCUMENTATION.md güncel mi?
- [ ] Yeni dosyalar eklendi mi?
- [ ] Silinen dosyalar çıkarıldı mı?
- [ ] Dosya açıklamaları doğru mu?
- [ ] Dosya haritası güncel mi?
- [ ] Version numarası doğru mu?

---

## 🚫 Yapılmaması Gerekenler

❌ FULL-DOCUMENTATION.md'yi silme
❌ Değişiklikleri dokümante etmeden commit yapma
❌ "Sonra güncellerim" deme
❌ Sadece kod değiştirip dokümantasyonu unutma

---

## ✅ İyi Pratikler

✅ Her commit'te dokümantasyonu kontrol et
✅ Yeni dosya eklerken hemen dokümante et
✅ Dosya silerken dokümantasyondan da sil
✅ Büyük değişikliklerde dokümantasyonu gözden geçir
✅ AI'ya sorduğunda FULL-DOCUMENTATION.md'yi referans göster

---

## 🤖 AI İçin Not

Eğer bu projeyle ilgili bir soru sorulursa:

1. Önce FULL-DOCUMENTATION.md'yi oku
2. İlgili dosyayı bul
3. Açıklamasını kontrol et
4. Gerekirse dosyayı oku
5. Cevap ver

**FULL-DOCUMENTATION.md olmadan proje anlaşılamaz!**

---

## 📞 Yardım

Dokümantasyon güncellemesi konusunda soru varsa:

1. FULL-DOCUMENTATION.md'yi örnek al
2. Aynı formatı kullan
3. Kısa ve net açıkla
4. Dosya haritasını güncelle

---

**Unutma**: Dokümantasyon kod kadar önemlidir! 📚

