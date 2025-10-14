# PART 3: Config ve Env Değişiklikleri

## Değişiklik Özeti

✅ .env.example güncellendi (JWT, MFA, GDPR, Adaptive Bitrate)
✅ config/index.js validation eklendi (envalid)
✅ package.json dependencies eklendi (jsonwebtoken, otplib, qrcode, uuid)
✅ config/secrets.enc.yaml.example oluşturuldu (SOPS template)
✅ config/roles.yaml oluşturuldu (RBAC)
✅ tests/unit/config.test.js oluşturuldu

## Yeni Env Variables

### Part 16-17: JWT & MFA
```bash
JWT_SECRET=your-jwt-secret-min-32-chars-change-this
JWT_ACCESS_TTL=900          # 15 minutes
JWT_REFRESH_TTL=604800      # 7 days
MFA_ISSUER=AdminAra
```

### Part 17: TURN TTL
```bash
TURN_TTL=300                # 5 minutes (was 3600)
TURN_MODE=rest              # Dynamic credentials
```

### Part 19: GDPR/KVKK
```bash
RETENTION_DAYS=30
ENABLE_PII_MASKING=true
ENCRYPTION_KEY=your-aes-256-key-32-bytes-change-this
```

### Part 6: Adaptive Bitrate
```bash
ADAPTIVE_BITRATE=true
MIN_BITRATE=300000          # 300kbps
MAX_BITRATE=1500000         # 1.5Mbps
BATTERY_THRESHOLD=0.2       # 20%
```

## Yeni Dependencies

```json
{
  "jsonwebtoken": "^9.0.2",    // JWT signing/verification
  "otplib": "^12.0.1",         // TOTP (MFA)
  "qrcode": "^1.5.3",          // QR code for MFA setup
  "uuid": "^9.0.1"             // JTI generation
}
```

## SOPS Encrypted Secrets

### Setup
```bash
# 1. Install SOPS
brew install sops  # macOS
# or
choco install sops  # Windows

# 2. Generate age key
age-keygen -o ~/.config/sops/age/keys.txt

# 3. Create secrets file
cp config/secrets.enc.yaml.example config/secrets.enc.yaml

# 4. Edit and encrypt
sops config/secrets.enc.yaml
```

### Usage in CI/CD
```yaml
# .github/workflows/deploy.yml
- name: Decrypt secrets
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
  run: |
    sops -d config/secrets.enc.yaml > .env
```

## RBAC Configuration

### Roles
- **admin**: Full access (queue, reports, users, settings, metrics)
- **operator**: Daily operations (queue, reports, metrics)
- **viewer**: Read-only (queue, reports, metrics)
- **support**: Customer interaction only (queue)

### Usage
```javascript
// routes/v1/admin.js
const { requireRole } = require('../middleware/rbac');

router.post('/queue/pop', 
  authMiddleware,
  requireRole('queue:pop'),
  popQueueHandler
);
```

## Config Validation

### Envalid Rules
```javascript
// config/index.js
JWT_SECRET: envalid.str({ 
  default: process.env.NODE_ENV === 'production' 
    ? undefined  // Force production to set
    : 'dev-jwt-secret-change-in-production'
}),
TURN_TTL: envalid.num({ 
  default: 300,
  max: 300  // Enforce ≤5 min
}),
```

### Test Coverage
```bash
npm test tests/unit/config.test.js

# Expected output:
# ✓ should load all required env variables
# ✓ should have secure defaults in production
# ✓ should validate TURN TTL is 300s or less
# ✓ should validate JWT TTL values
# ✓ should validate bitrate ranges
# ✓ should validate battery threshold
```

## Migration Guide

### From Old to New

**Old (.env):**
```bash
TURN_SECRET=static_secret
# No JWT
# No MFA
# No GDPR
```

**New (.env):**
```bash
# TURN with rotation
TURN_SECRET=dynamic_secret_rotated_weekly
TURN_TTL=300

# JWT with revocation
JWT_SECRET=secure_32_char_secret
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800

# MFA
MFA_ISSUER=AdminAra

# GDPR
RETENTION_DAYS=30
ENABLE_PII_MASKING=true
ENCRYPTION_KEY=aes_256_key_32_bytes

# Adaptive Bitrate
ADAPTIVE_BITRATE=true
MIN_BITRATE=300000
MAX_BITRATE=1500000
BATTERY_THRESHOLD=0.2
```

## Security Improvements

| Feature | Old | New | Benefit |
|---------|-----|-----|---------|
| TURN TTL | 3600s | 300s | %92 risk ↓ |
| Secrets | Plaintext .env | SOPS encrypted | Git-safe |
| JWT | None | With revocation | Auth security |
| MFA | None | TOTP | 2FA |
| RBAC | None | 4 roles | Least privilege |
| PII | Exposed | Masked | GDPR compliance |

## Next Steps

- ✅ Part 3 completed
- ⏭️ Part 4: Socket ve Route refactor
- ⏭️ Part 5: Utils modülleri (auth.js, rbac.js)
- ⏭️ Part 16: MFA implementation
- ⏭️ Part 17: TURN rotation job

---

**Hazırlayan:** Amazon Q  
**Tarih:** 2024  
**Versiyon:** 1.0
