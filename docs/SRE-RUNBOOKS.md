# 🔧 SRE Runbooks - AdminAra v1.3.2

Site Reliability Engineering operational procedures for AdminAra WebRTC support system.

---

## 🚨 Incident Response Procedures

### P1: Service Down (Complete Outage)

**Detection**: Health check fails, no user access

**Response Time**: < 5 minutes

**Steps**:
1. Check Render service status
2. Verify DNS resolution: `nslookup adminara.onrender.com`
3. Check recent deployments
4. Rollback if deployment-related: `git revert HEAD && git push`
5. Check resource limits (CPU/Memory)
6. Escalate to Render support if infrastructure issue

**Recovery**: Service restored, health check passes

---

### P2: Degraded Performance (High Latency/Errors)

**Detection**: Error rate >5%, reconnect p95 >15s

**Response Time**: < 15 minutes

**Steps**:
1. Check metrics: `curl https://adminara.onrender.com/metrics`
2. Review error logs in Render dashboard
3. Identify error patterns (WebRTC, Socket.IO, HTTP)
4. Check TURN server connectivity
5. Verify rate limiting not blocking legitimate traffic
6. Scale resources if needed
7. Deploy hotfix if code issue identified

**Recovery**: Error rate <1%, reconnect p95 <8s

---

### P3: Feature Degradation (Non-Critical)

**Detection**: Specific feature failing, core service operational

**Response Time**: < 1 hour

**Steps**:
1. Document issue with reproduction steps
2. Check feature-specific logs
3. Verify configuration (env vars)
4. Create bug ticket
5. Schedule fix in next deployment window

**Recovery**: Feature restored or workaround documented

---

## 🔍 Troubleshooting Guides

### WebRTC Connection Failures

**Symptoms**: Customers can't connect, black video screens

**Diagnosis**:
```bash
# 1. Check ICE server config
curl https://adminara.onrender.com/config

# 2. Verify STUN/TURN servers
# Use: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

# 3. Check browser console for ICE errors
# Look for: "ICE failed", "connection timeout"
```

**Common Causes**:
- TURN server down/misconfigured
- Firewall blocking UDP ports
- Invalid TURN credentials
- Browser permissions denied

**Resolution**:
1. Test TURN server independently
2. Verify env vars: TURN_URL, TURN_USER, TURN_PASS
3. Check firewall rules (UDP 3478, TCP 443)
4. Fallback to STUN-only if TURN unavailable

---

### Socket.IO Disconnections

**Symptoms**: Frequent reconnects, "socket disconnected" logs

**Diagnosis**:
```bash
# 1. Check connection stability
# Browser console: socket.connected

# 2. Review Socket.IO transport
# Look for: "transport": "websocket" vs "polling"

# 3. Check server logs for disconnect reasons
```

**Common Causes**:
- Network instability
- Server restart/deployment
- Load balancer timeout
- Client-side network change

**Resolution**:
1. Verify auto-reconnect working (<8s)
2. Check Socket.IO pingTimeout/pingInterval settings
3. Review load balancer keep-alive settings
4. Monitor reconnect metrics

---

### Admin Login Issues

**Symptoms**: OTP not received, login fails

**Diagnosis**:
```bash
# 1. Verify Telegram bot
curl -X POST https://api.telegram.org/bot<TOKEN>/getMe

# 2. Check OTP generation logs
# Look for: "OTP generated for admin"

# 3. Test OTP endpoint
curl -X POST https://adminara.onrender.com/admin/otp/request \
  -H "Content-Type: application/json" \
  -d '{"adminId":"admin"}'
```

**Common Causes**:
- Telegram bot token invalid/expired
- Chat ID incorrect
- Rate limiting blocking requests
- OTP expired (5 min TTL)

**Resolution**:
1. Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
2. Check rate limiter: 3 requests/15min per IP
3. Regenerate bot token if compromised
4. Clear rate limit cache if false positive

---

### High Memory Usage

**Symptoms**: Service slow, OOM errors

**Diagnosis**:
```bash
# 1. Check Render metrics dashboard
# Memory usage trend

# 2. Review active connections
# Socket.IO rooms, peer connections

# 3. Check for memory leaks
# Look for: dangling timers, unclosed streams
```

**Common Causes**:
- Memory leak in peer connections
- Too many concurrent connections
- Large log buffers
- Unclosed media streams

**Resolution**:
1. Restart service to clear memory
2. Review peer connection cleanup code
3. Implement connection limits
4. Add memory monitoring alerts
5. Upgrade Render plan if sustained high usage

---

## 📊 Monitoring & Alerting

### Critical Metrics

**Health Check**:
```bash
# Every 30s
curl https://adminara.onrender.com/health
# Alert if: 3 consecutive failures
```

**Connection Success Rate**:
```promql
rate(webrtc_connection_success_total[5m]) / 
rate(webrtc_connection_attempts_total[5m])
# Alert if: <90% for 5 minutes
```

**Reconnect Duration**:
```promql
histogram_quantile(0.95, 
  rate(webrtc_reconnect_duration_ms_bucket[5m])
)
# Alert if: >8000ms for 5 minutes
```

**Error Rate**:
```promql
rate(http_requests_total{status=~"5.."}[5m]) / 
rate(http_requests_total[5m])
# Alert if: >1% for 5 minutes
```

---

## 🔐 Security Procedures

### Suspected XSS Attack

**Detection**: Unusual script execution, cookie theft attempts

**Response**:
1. Review CSP violation reports
2. Check for inline scripts in user input
3. Verify httpOnly cookies not accessible
4. Review recent code changes
5. Deploy CSP tightening if needed

---

### CSRF Attack on Metrics

**Detection**: Metrics pollution from foreign origins

**Response**:
1. Check metrics origin guard logs
2. Verify 403 responses for foreign origins
3. Review allowed origins list
4. Add additional origin validation if needed

---

### Brute Force OTP Attempts

**Detection**: High rate of failed OTP verifications

**Response**:
1. Check rate limiter effectiveness
2. Verify 3 attempts/15min limit enforced
3. Review IP addresses for patterns
4. Add IP blocking if coordinated attack
5. Consider CAPTCHA for repeated failures

---

## 🔄 Maintenance Procedures

### Routine Deployment

**Frequency**: As needed (typically weekly)

**Steps**:
1. Run full test suite: `npm test`
2. Verify coverage: `npm run test:coverage` (>70%)
3. Review CHANGELOG
4. Deploy during low-traffic window
5. Monitor for 30 minutes post-deploy
6. Rollback if error rate >1%

---

### Dependency Updates

**Frequency**: Monthly (security patches immediately)

**Steps**:
```bash
# 1. Check for vulnerabilities
npm audit

# 2. Update dependencies
npm update

# 3. Run tests
npm test

# 4. Deploy to staging first
# 5. Monitor for 24 hours
# 6. Deploy to production
```

---

### Database Backup (if applicable)

**Frequency**: Daily (automated)

**Verification**:
```bash
# 1. Check backup timestamp
# 2. Test restore procedure quarterly
# 3. Verify backup integrity
```

---

## 📞 Escalation Matrix

| Severity | Response Time | Escalation Path |
|----------|---------------|-----------------|
| P1 (Outage) | 5 min | On-call → Manager → CTO |
| P2 (Degraded) | 15 min | On-call → Manager |
| P3 (Feature) | 1 hour | On-call → Team Lead |

---

## 🛠️ Useful Commands

### Quick Health Check
```bash
curl -s https://adminara.onrender.com/health | jq
```

### View Metrics
```bash
curl -s https://adminara.onrender.com/metrics | grep webrtc
```

### Test TURN Server
```bash
# Use online tool: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
# Or: npm install -g turn-test
turn-test $TURN_URL $TURN_USER $TURN_PASS
```

### Check Socket.IO Connections
```javascript
// Browser console on admin page
socket.io.engine.transport.name // "websocket" or "polling"
socket.connected // true/false
```

### Force Reconnect Test
```javascript
// Browser console
socket.disconnect();
setTimeout(() => socket.connect(), 1000);
```

---

**Last Updated**: 2025-10-11  
**Version**: 1.3.2  
**Owner**: SRE Team
