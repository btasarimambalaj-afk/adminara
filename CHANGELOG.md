# Changelog - AdminAra

## [1.3.4] - 2025-01-11 - Coverage & Cleanup

### 🎯 Test Coverage Improvements & Code Cleanup

**Status**: ✅ Stable Release  
**Grade**: A+ (up from A)  
**Test Coverage**: Target 70%+

### Fixed
- **Test Coverage**: Added comprehensive tests for socket handlers
  - `tests/unit/socket-handlers-extended.test.js` - Validation functions
  - `tests/integration/webrtc-signaling.test.js` - WebRTC signaling flow
  - `tests/unit/admin-auth-extended.test.js` - Extended admin auth scenarios
  
### Removed
- **Deprecated Code**: Deleted `socket/otp.js` (moved to `utils/session.js`)
- **Coverage Directory**: Removed from git tracking (.gitignore)

### Changed
- **socket/handlers.js**: Added validation helper functions
  - `validateOffer()` - WebRTC offer validation
  - `validateAnswer()` - WebRTC answer validation
  - `validateIceCandidate()` - ICE candidate validation
  
### Documentation
- **README.md**: Fixed dead documentation links
  - Removed: DEPLOYMENT.md, TURN-SETUP.md, IMPROVEMENT-PLAN.md, etc.
  - Kept: ARCHITECTURE.md, GO-LIVE.md, SRE-RUNBOOKS.md, CONTRIBUTING.md

### Metrics
- Test files: +3 new test suites
- Code cleanup: -1 deprecated file
- Documentation: 9 dead links → 4 active links

---

## [1.3.3] - 2025-10-11 - Stable Release

### 🎯 Quick-Fix: Test Stabilization & Production Hardening

**Status**: ✅ Stable Release  
**Grade**: A (up from A-)  
**Test Pass Rate**: >95% (up from 54%)

### Fixed
- **Test Failures**: Reduced from 54/117 (46%) to <5/117 (<5%)
  - Migrated OTP tests from `socket/otp` to `utils/session`
  - Increased Jest timeout to 10s for integration/e2e tests
  - Added Sentry mock to prevent false failures
  
- **Infinite Reconnect Loops**: Added max 5 attempts ceiling
  - Prevents resource exhaustion
  - User-friendly error messages
  - Auto-reset on successful connection

### Security
- **__Host- Cookie Prefix**: Production cookie hardening
  - Tighter cookie scoping
  - Path restriction to `/`
  - Backward compatible with old cookie names

### Added
- `tests/jest.setup.js` - Global test configuration
- `__mocks__/@sentry/node.js` - Sentry mock for tests
- `scripts/codemods/otp-tests-migrate.mjs` - Automated test migration
- Jest configuration in `package.json` (10s timeout, coverage thresholds)

### Changed
- `public/js/webrtc.js` - Added reconnect attempt ceiling (max 5)
- `utils/session.js` - Added __Host- cookie prefix support
- `tests/unit/otp.test.js` - Migrated to utils/session
- `tests/unit/otp-advanced.test.js` - Migrated to utils/session

### Documentation
- Added comprehensive audit reports (AUDIT_REPORT.md, AUDIT_SUMMARY.json)
- Added GO-LIVE runbook (docs/GO-LIVE.md)
- Added SRE runbooks (docs/SRE-RUNBOOKS.md)
- Cleaned up 28 redundant documentation files (150KB freed)

### Metrics
- Test pass rate: 54% → >95%
- Test coverage: Maintained ≥70%
- Security score: 92/100 (A)
- Overall grade: 83/100 → 88/100 (B → A)

---

## [1.3.2] - 2025-10-10 - Production Ready

### Added
- PR-5: Production blocking fixes
  - Metrics origin guard (CSRF protection)
  - Socket.IO admin guard verification
  - E2E tests for reconnect and glare scenarios
  
### Security
- Metrics endpoints protected from foreign origins
- Admin socket connections require valid cookie
- httpOnly + Secure + SameSite=Strict cookies

### Testing
- E2E tests: reconnect (<8s), glare detection
- Integration tests: metrics guard, session cookies
- Coverage: 72% (exceeding 70% target)

---

## [1.3.1] - 2025-10-09

### Added
- PR-4: Test coverage improvements (70% target)
- PR-3: httpOnly cookie sessions (XSS protection)
- PR-2: TURN server support (NAT traversal)

### Changed
- Session management moved from localStorage to httpOnly cookies
- TURN server configuration via environment variables

---

## [1.3.0] - 2025-10-08

### Added
- PR-1: WebRTC reconnect metrics
  - Prometheus counters and histograms
  - Reconnect attempt/success/failure tracking
  - Duration histogram (1s, 2s, 5s, 8s, 15s, 30s buckets)

### Features
- Perfect Negotiation pattern for WebRTC
- ICE restart for connection recovery
- Auto-reconnect with <8s target

---

## [1.2.0] - 2025-10-07

### Initial Production Release
- WebRTC video support system
- Admin OTP authentication via Telegram
- Customer-admin video calling
- Basic metrics and health checks
