# Known Issues (Fixed in v1.3.7)

## Critical Issues Fixed

### 1. Environment Variables & Deployment
- ✅ **FIXED**: Render generates `SESSION_SECRET` but app expects `COOKIE_SECRET`
  - Added `COOKIE_SECRET` to render.yaml with auto-generation
  - Updated config validation to require both secrets in production

- ✅ **FIXED**: TURN server variable name mismatch
  - Render.yaml used: `TURN_URL`, `TURN_USER`, `TURN_PASS`
  - App expected: `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`
  - All files now use consistent naming

- ✅ **FIXED**: Docker-compose uses wrong variable names
  - Removed: `TELEGRAM_CHAT_ID`, `ADMIN_OTP_SECRET`
  - Added: `TELEGRAM_ADMIN_CHAT_ID`, `SESSION_SECRET`, `COOKIE_SECRET`

- ✅ **FIXED**: config/index.js not used anywhere
  - Now imported and used in server.js for early validation
  - All environment variables validated on startup

### 2. Runtime Errors & Code Structure
- ✅ **FIXED**: Socket.IO handler signature mismatch
  - `server.js` called: `adminAuthHandlers(io, socket, state)`
  - Handler expected: `adminAuthHandlers(socket, state)`
  - Updated handler to accept correct parameters

- ✅ **FIXED**: OTP state management inconsistency
  - OTP now stored in both `adminPasswordStore` and `stateStore` (Redis)
  - Supports horizontal scaling and server restarts
  - Failed attempts tracked centrally in `failedAttempts` map

- ✅ **FIXED**: Logger crashes on first run
  - `logs/` directory not included in repo
  - Logger now auto-creates directory if missing
  - Added `logs/` to .gitignore

- ✅ **FIXED**: Multiple session management modules
  - Removed: `utils/auth.js`, `utils/session.js`
  - Kept: `utils/admin-session.js` (active implementation)
  - Tests updated to use single source of truth

### 3. Security & OTP
- ✅ **FIXED**: OTP cleanup doesn't prevent memory leak
  - Cleanup interval now removes expired entries
  - Failed attempts map cleaned on successful login
  - Rate limiter integrated with OTP verification

### 4. Observability & Health Checks
- ✅ **FIXED**: Health endpoint always returns "ok"
  - Now returns 503 status when services degraded
  - Checks Redis, Telegram, Queue health individually
  - Reports detailed service status

## Remaining Work

### Documentation
- [ ] Update FULL-DOCUMENTATION.md with removed files
- [x] Document new environment variables (README + .env.example)
- [ ] Add deployment troubleshooting guide

### Testing
- [x] Update tests for new handler signatures
- [ ] Add integration tests for OTP state store
- [ ] Test health endpoint degraded states

### Production Readiness
- [ ] Deploy to staging and verify all fixes
- [ ] Monitor logs for 24h
- [ ] Update status to "Production Ready" after validation

## Version History

- **v1.3.7** (Current): Critical infrastructure fixes
- **v1.3.6**: UI improvements, documentation
- **v1.3.5**: Redis state store, BullMQ queue
