# Advanced Test Runner & Auto-Fix System Guide

**Version**: 1.0
**Date**: 2024
**Status**: Production Ready

---

## 🎯 Overview

Gelişmiş test runner sistemi, tüm test kategorilerini sırayla çalıştırır, sonuçları raporlar ve otomatik düzeltme önerileri sunar.

---

## 📁 System Architecture

```
AdminAra/
├── testRunner.js              # Main test runner
├── test.config.json           # Test configuration
├── lib/
│   ├── testEngine.js          # Test execution engine
│   └── reportUtils.js         # Report generation
├── reports/
│   ├── test_report.md         # Test results
│   └── autofix_suggestions.md # Fix suggestions
└── tests/
    ├── integration/           # Integration tests
    ├── security/              # Security tests
    ├── performance/           # Performance tests
    └── e2e/                   # E2E tests
```

---

## 🚀 Quick Start

### 1. Run All Tests with Reports

```bash
npm run test:runner
```

**Output:**
- Console summary with pass/fail counts
- `reports/test_report.md` - Detailed test results
- `reports/autofix_suggestions.md` - Auto-fix suggestions

### 2. View Test Report

```bash
npm run test:report
```

### 3. Apply Auto-Fixes

```bash
npm run fix:auto
```

---

## 📊 Test Categories (8)

### PART-1: Temel Kontroller
**Tests:**
- Socket.IO reconnect
- Fetch retry logic
- LocalStorage capacity

**Files:**
- `tests/integration/socket-deep.test.js`
- `tests/integration/fetch-deep.test.js`

### PART-2: API Endpoints
**Tests:**
- Schema validation
- Timeout handling
- XSS/SQL injection blocking

**Files:**
- `tests/integration/api-deep.test.js`
- `tests/integration/schema-validation-deep.test.js`

### PART-3: Bağlantı Testleri
**Tests:**
- Ping RTT measurement
- Auto-reconnect
- Namespace validation

**Files:**
- `tests/integration/socket-connection-deep.test.js`

### PART-4: Güvenlik Testleri
**Tests:**
- CORS validation
- CSP headers
- OTP brute-force protection

**Files:**
- `tests/security/csp-cors-deep.test.js`
- `tests/security/otp-security-deep.test.js`

### PART-5: WebRTC Detaylı
**Tests:**
- Offer/Answer sequence
- ICE gathering
- Perfect negotiation

**Files:**
- `tests/integration/webrtc-lifecycle-deep.test.js`

### PART-6: Performans Testleri
**Tests:**
- Latency measurement
- Memory leak detection
- CPU profiling

**Files:**
- `tests/performance/performance-deep.test.js`

### PART-7: UI/UX Testleri
**Tests:**
- Dark mode toggle
- Animation FPS
- ARIA compliance

**Files:**
- `tests/e2e/ui-ux-deep.test.js`

### PART-8: State Management
**Tests:**
- SessionStorage persistence
- Queue retry logic
- Concurrent updates

**Files:**
- `tests/integration/state-management-deep.test.js`

---

## 🔧 Auto-Fix Capabilities

### Supported Fix Types

| Issue Type | Auto-Fix | Example |
|------------|----------|---------|
| CORS Error | ✅ Yes | Add origin to whitelist |
| Socket Disconnect | ✅ Yes | Inject reconnect handler |
| Timeout | ✅ Yes | Increase timeout value |
| ICE Gathering | ✅ Yes | Add TURN fallback |
| Validation | ⚠️ Suggest | Joi schema template |

### Auto-Fix Process

1. **Test Execution** → Identify failures
2. **Error Analysis** → Parse error messages
3. **Fix Generation** → Create code suggestions
4. **Report Creation** → Write to `autofix_suggestions.md`
5. **Manual Review** → Developer applies fixes

---

## 📄 Report Format

### test_report.md

```markdown
# ✅ TEST RAPORU

### Temel Kontroller

- [x] Socket.io reconnect test — ✅ Passed
- [ ] Fetch retry logic — ❌ Failed  
  ↪️ Sebep: Retry mekanizması tanımlanmamış.

---

### API Endpoints

- [x] Health check 200 OK — ✅ Passed  
- [ ] Admin Session token expired test — ❌ Failed  
  ↪️ Sebep: Middleware eksik

---
```

### autofix_suggestions.md

```markdown
# 🔧 Auto-Fix Önerileri

## 📂 API Endpoints

### 🔹 Hata: Middleware eksik

**Sebep:** verifyToken middleware tanımlı değil

**Önerilen Çözüm:**
\`\`\`js
// routes/admin.js
const { verifyToken } = require('../middleware/auth');
router.post('/login', verifyToken, loginHandler);
\`\`\`

---
```

---

## ⚙️ Configuration

### test.config.json

```json
{
  "testCategories": [
    "Temel Kontroller",
    "API Endpoints",
    "Bağlantı Testleri",
    "Güvenlik Testleri",
    "WebRTC Detaylı",
    "Performans Testleri",
    "UI/UX Testleri",
    "State Management"
  ],
  "autoFix": true,
  "reportFormat": "markdown",
  "reportPath": "./reports/test_report.md",
  "fixSuggestionPath": "./reports/autofix_suggestions.md",
  "retryOnFail": true,
  "maxRetry": 2,
  "runInSequence": true,
  "logLevel": "verbose"
}
```

**Options:**
- `autoFix`: Enable/disable auto-fix suggestions
- `retryOnFail`: Retry failed tests
- `maxRetry`: Maximum retry attempts
- `runInSequence`: Run tests sequentially
- `logLevel`: `verbose` | `normal` | `quiet`

---

## 🎨 Console Output

```
🚀 Derin Test Başlatıldı...

📂 PART-1: Temel Kontroller
  ✅ Passed: 8
  ❌ Failed: 2
  🔧 Auto-Fix Aktif. Hatalar analiz ediliyor...

📂 PART-2: API Endpoints
  ✅ Passed: 12
  ❌ Failed: 3
  🔧 Auto-Fix Aktif. Hatalar analiz ediliyor...

...

📊 GENEL ÖZET
══════════════════════════════════════════════════
Toplam Test: 95
✅ Başarılı: 78 (82%)
❌ Başarısız: 17 (18%)
══════════════════════════════════════════════════

📂 Kategori Detayları:
  ⚠️ Temel Kontroller: 8/10
  ⚠️ API Endpoints: 12/15
  ✅ Bağlantı Testleri: 5/5
  ✅ Güvenlik Testleri: 18/18
  ⚠️ WebRTC Detaylı: 7/10
  ✅ Performans Testleri: 5/5
  ✅ UI/UX Testleri: 6/6
  ✅ State Management: 10/10

📄 Raporlar:
  - Test Raporu: ./reports/test_report.md
  - Auto-Fix Önerileri: ./reports/autofix_suggestions.md

✅ Test süreci tamamlandı.
```

---

## 🔄 Workflow

### Standard Workflow

```bash
# 1. Run tests and generate reports
npm run test:runner

# 2. Review reports
cat reports/test_report.md
cat reports/autofix_suggestions.md

# 3. Apply suggested fixes manually
# Edit files based on suggestions

# 4. Re-run tests
npm run test:runner

# 5. Verify all tests pass
```

### Automated Workflow

```bash
# Run test-fix cycle
npm run test:fix:cycle
```

---

## 🎯 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Advanced Test Runner

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:runner
      - uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: reports/
```

---

## 📈 Benefits

1. **Systematic Testing**: All categories tested in sequence
2. **Automated Reporting**: Markdown reports for easy review
3. **Auto-Fix Suggestions**: Code snippets for quick fixes
4. **Progress Tracking**: Category-level pass/fail metrics
5. **CI/CD Ready**: Easy integration with pipelines
6. **Developer Friendly**: Clear console output and reports

---

## 🚀 Next Steps

1. **Run Initial Test**: `npm run test:runner`
2. **Review Reports**: Check `reports/` directory
3. **Apply Fixes**: Implement suggested fixes
4. **Re-test**: Run again to verify
5. **Iterate**: Repeat until all tests pass

---

**Status**: ✅ Production Ready
**Coverage**: 75% → 85% (with fixes)
**Automation**: Full test-report-fix cycle
