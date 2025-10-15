# AdminAra - Common Issues & Troubleshooting

## 🔴 WebRTC Connection Failed

**Symptoms**: Users can't establish video call

**Check**:
1. TURN server health: `curl https://turn-server-url`
2. Redis connection: `redis-cli ping`
3. Network connectivity: `curl https://adminara.onrender.com/health`

**Fix**:
1. Check TURN credentials in `.env`
2. Verify firewall allows UDP ports
3. Clear browser cache and retry
4. Check browser console for errors

---

## 🔴 High Memory Usage

**Symptoms**: Memory usage >90%, slow response

**Check**:
1. Memory stats: `GET /health/detailed`
2. Active connections: Check Socket.IO connections
3. Redis memory: `redis-cli info memory`

**Fix**:
1. Restart application: `pm2 restart adminara`
2. Clear Redis cache: `redis-cli FLUSHDB`
3. Check for memory leaks in logs
4. Scale horizontally if needed

---

## 🔴 Redis Connection Lost

**Symptoms**: "Redis connection failed" errors

**Check**:
1. Redis status: `redis-cli ping`
2. Redis logs: `tail -f /var/log/redis/redis-server.log`
3. Network connectivity

**Fix**:
1. Restart Redis: `sudo systemctl restart redis`
2. Check Redis config: `/etc/redis/redis.conf`
3. Verify REDIS_URL in `.env`
4. Application will fallback to in-memory store

---

## 🟡 Slow Response Times

**Symptoms**: API responses >1s

**Check**:
1. Prometheus metrics: `http://localhost:9090`
2. Response times: `http_request_duration_seconds`
3. Active connections: `websocket_connections_total`

**Fix**:
1. Check Redis latency
2. Optimize database queries
3. Enable connection pooling
4. Scale horizontally

---

## 🟡 OTP Not Received

**Symptoms**: Admin can't login, OTP not generated

**Check**:
1. OTP secret configured: `ADMIN_OTP_SECRET` in `.env`
2. Time sync: `date` (must be accurate)
3. Rate limiting: Check if IP is rate-limited

**Fix**:
1. Verify OTP secret is valid base32
2. Sync system time: `sudo ntpdate pool.ntp.org`
3. Clear rate limit: Restart application
4. Use backup admin account

---

## 🟡 Socket.IO Disconnections

**Symptoms**: Frequent WebSocket disconnects

**Check**:
1. Network stability
2. Load balancer timeout settings
3. Socket.IO logs

**Fix**:
1. Increase pingTimeout in Socket.IO config
2. Check reverse proxy WebSocket support
3. Enable sticky sessions on load balancer
4. Check client-side reconnection logic

---

## 🟢 Metrics Not Accessible

**Symptoms**: `/metrics` returns 401

**Check**:
1. Authorization header: `Authorization: Basic <token>`
2. ALLOWED_METRICS_ORIGINS in `.env`

**Fix**:
1. Add Grafana origin to ALLOWED_METRICS_ORIGINS
2. Use correct Basic auth credentials
3. Check CORS configuration

---

## 📞 Emergency Contacts

- **On-Call Engineer**: [Your contact]
- **DevOps Team**: [Team contact]
- **Escalation**: [Manager contact]

---

## 🔗 Quick Links

- [Health Check](https://adminara.onrender.com/health)
- [Detailed Health](https://adminara.onrender.com/health/detailed)
- [Metrics](https://adminara.onrender.com/metrics)
- [Grafana Dashboard](http://localhost:3001)
- [Prometheus](http://localhost:9090)
