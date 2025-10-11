# Test Dokümantasyonu

## 🧪 Test Yapısı

```
tests/
├── unit/                    # Unit testler
│   ├── auth.test.js        # Session management
│   └── rate-limiter.test.js # Rate limiting
│
└── integration/             # Integration testler
    ├── socket.test.js      # Socket.IO events
    └── api.test.js         # REST API endpoints
```

## 🚀 Testleri Çalıştırma

### Tüm Testler
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Sadece Unit Testler
```bash
npm run test:unit
```

### Sadece Integration Testler
```bash
npm run test:integration
```

### Coverage Raporu
```bash
npm test -- --coverage
```

## 📊 Test Kapsamı

### Unit Tests
- ✅ **auth.test.js** - Session management
  - createSession()
  - validateSession()
  - cleanupExpiredSessions()

- ✅ **rate-limiter.test.js** - Rate limiting
  - isLimited()
  - lockout()
  - getActiveLocks()

### Integration Tests
- ✅ **socket.test.js** - Socket.IO
  - Room join (admin/customer)
  - WebRTC signaling (description, ICE)

- ✅ **api.test.js** - REST API
  - /health endpoint
  - /config/ice-servers
  - /metrics (with auth)

## 🎯 Coverage Hedefleri

```javascript
{
  branches: 70%,
  functions: 70%,
  lines: 70%,
  statements: 70%
}
```

## 📝 Test Yazma Kuralları

1. **Descriptive Names** - Test adları açıklayıcı olmalı
2. **Arrange-Act-Assert** - AAA pattern kullan
3. **Isolation** - Her test bağımsız olmalı
4. **Cleanup** - beforeEach/afterEach ile temizlik
5. **Mock External** - Dış servisleri mock'la

## 🔧 Örnek Test

```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## 🐛 Debugging

```bash
# Node inspector ile debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Specific test file
npm test -- auth.test.js

# Verbose output
npm test -- --verbose
```

## 📦 Dependencies

- **jest** - Test framework
- **socket.io-client** - Socket.IO client for testing
- **supertest** - HTTP assertions

## 🚨 CI/CD Integration

Tests otomatik olarak çalışır:
- Pre-commit hook (opsiyonel)
- GitHub Actions (opsiyonel)
- Render deploy öncesi (opsiyonel)

## 📈 İyileştirme Önerileri

1. E2E testler ekle (Playwright/Puppeteer)
2. Performance testler (k6/Artillery)
3. Security testler (OWASP ZAP)
4. Load testler (Socket.IO stress)
