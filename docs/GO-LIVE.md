# 🚀 GO-LIVE Runbook - AdminAra v1.3.2

**Production URL**: https://adminara.onrender.com  
**Version**: 1.3.2  
**Status**: Production Ready (Grade A-, 88/100)  
**Last Updated**: 2025-10-11

---

## 📋 Pre-Deployment Checklist

### Environment Variables
```bash
# Required
NODE_ENV=production
PORT=3000
PUBLIC_URL=https://adminara.onrender.com
SESSION_SECRET=<strong-random-32-chars>
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_CHAT_ID=<admin-chat-id>

# Optional (TURN Server)
TURN_URL=turn:turn.example.com:3478
TURN_USER=username
TURN_PASS=password
```

### Security Checklist
- [x] httpOnly + Secure + SameSite=Strict cookies
- [x] Metrics origin guard (CSRF protection)
- [x] Socket.IO admin authentication
- [x] Rate limiting active
- [x] CSP headers configured
- [x] No credentials in code

### Test Coverage
- [x] 72% overall coverage (target: 70%)
- [x] 38/38 tests passing
- [x] E2E tests (reconnect + glare)
- [x] Integration tests (metrics guard)

---

## 🎯 Deployment Steps

### 1. Final Verification
```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Verify no uncommitted changes
git status
```

### 2. Deploy to Production
```bash
# Commit cleanup
git add -A
git commit -m "chore(clean): minimal docs for production"

# Push to main (triggers auto-deploy)
git push origin main
```

### 3. Monitor Deployment
```bash
# Watch Render logs
# https://dashboard.render.com/web/<service-id>/logs

# Wait for health check
curl https://adminara.onrender.com/health
# Expected: {"status":"ok","uptime":X,"timestamp":"..."}
```

---

## ✅ Post-Deployment Validation

### Health Checks
```bash
# 1. Health endpoint
curl https://adminara.onrender.com/health
# Expected: 200 OK

# 2. Metrics endpoint
curl https://adminara.onrender.com/metrics
# Expected: Prometheus metrics

# 3. Config endpoint
curl https://adminara.onrender.com/config
# Expected: {"iceServers":[...]}
```

### Security Tests
```bash
# 1. Metrics origin guard (should block)
curl -X POST https://adminara.onrender.com/metrics/reconnect-attempt \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"value":1}'
# Expected: 403 Forbidden

# 2. Admin socket without auth (should reject)
# Open browser console at https://adminara.onrender.com/admin
# Try connecting without OTP
# Expected: "unauthorized" event
```

### Manual Flow Tests

#### Customer Flow
1. Open https://adminara.onrender.com
2. Enter name (min 2 chars)
3. Click "Destek Ara"
4. Verify camera/mic permissions
5. Wait for admin connection
6. Test reconnect: Disable network 3s → Enable
7. Verify reconnect < 8s
8. End call

#### Admin Flow
1. Open https://adminara.onrender.com/admin
2. Click "Şifre İste" → Check Telegram
3. Enter 6-digit OTP
4. Verify login success
5. Wait for customer
6. Test controls (mute/camera/speaker)
7. End call
8. Verify session persists (no re-login needed)

---

## 📊 Monitoring & Alerts

### Key Metrics
```promql
# Connection success rate (target: >90%)
rate(webrtc_connection_success_total[5m]) / 
rate(webrtc_connection_attempts_total[5m])

# Reconnect p95 (target: <8s)
histogram_quantile(0.95, 
  rate(webrtc_reconnect_duration_ms_bucket[5m])
)

# Error rate (target: <1%)
rate(http_requests_total{status=~"5.."}[5m]) / 
rate(http_requests_total[5m])
```

### Alert Rules
- Connection success rate < 90% for 5 minutes
- Reconnect p95 > 8000ms for 5 minutes
- Error rate > 1% for 5 minutes
- Health check fails 3 consecutive times

---

## 🔥 Incident Response

### Scenario 1: High Error Rate
```bash
# 1. Check logs
curl https://adminara.onrender.com/health

# 2. Check metrics
curl https://adminara.onrender.com/metrics | grep error

# 3. Rollback if needed
git revert HEAD
git push origin main
```

### Scenario 2: WebRTC Connection Failures
```bash
# 1. Verify TURN server
curl https://adminara.onrender.com/config

# 2. Check ICE candidates in browser console
# Look for "relay" candidates

# 3. Test STUN/TURN connectivity
# Use https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
```

### Scenario 3: Admin Login Issues
```bash
# 1. Verify Telegram bot
# Send test message to bot

# 2. Check OTP generation
# Look for "OTP generated" in logs

# 3. Verify cookie settings
# Check browser DevTools → Application → Cookies
# Should see: httpOnly=true, Secure=true, SameSite=Strict
```

---

## 🔄 Rollback Plan

### Quick Rollback (< 2 minutes)
```bash
# 1. Revert last commit
git revert HEAD

# 2. Push to trigger redeploy
git push origin main

# 3. Monitor health
watch -n 2 'curl -s https://adminara.onrender.com/health'
```

### Full Rollback (< 5 minutes)
```bash
# 1. Checkout previous stable version
git checkout v1.3.1

# 2. Force push (emergency only)
git push origin main --force

# 3. Verify deployment
curl https://adminara.onrender.com/health
```

---

## 📈 Success Criteria

### Technical SLOs
- Uptime: 99.5% (monthly)
- Connection success rate: >90%
- Reconnect p95: <8s
- Error rate: <1%
- Test coverage: >70%

### Business Metrics
- Customer satisfaction: >4.5/5
- Average call duration: 3-5 minutes
- Admin response time: <30s
- Call completion rate: >95%

---

## 🛠️ Maintenance

### Weekly Tasks
- Review error logs
- Check test coverage
- Update dependencies (security patches)
- Verify backup/restore procedures

### Monthly Tasks
- Performance audit
- Security scan (npm audit)
- Load testing
- Documentation review

---

## 📞 Support Contacts

**On-Call Engineer**: [Your Contact]  
**Escalation**: [Manager Contact]  
**Render Support**: https://render.com/support

---

## 📚 Additional Resources

- [Architecture](./ARCHITECTURE.md)
- [SRE Runbooks](./SRE-RUNBOOKS.md)
- [GitHub Repository](https://github.com/btasarimambalaj-afk/adminara)
- [Render Dashboard](https://dashboard.render.com)

---

**Last Deployment**: 2025-10-11  
**Next Review**: 2025-11-11  
**Status**: ✅ PRODUCTION READY
