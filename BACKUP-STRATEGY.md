# Backup & Disaster Recovery Strategy

## 🔄 Backup Strategy

### Redis Backup (if using paid tier)

**RDB (Redis Database Backup)**:

```bash
# Automatic snapshots
save 900 1      # After 900s if 1 key changed
save 300 10     # After 300s if 10 keys changed
save 60 10000   # After 60s if 10000 keys changed
```

**AOF (Append Only File)**:

```bash
appendonly yes
appendfsync everysec
```

**Manual Backup**:

```bash
redis-cli BGSAVE
redis-cli --rdb /backup/dump.rdb
```

### Session Backup

**In-Memory Fallback**: Already implemented

- Sessions stored in Map if Redis unavailable
- Auto-cleanup on expiry

**Redis Backup**:

- Sessions expire automatically (TTL)
- No persistent backup needed

### Log Backup

**Winston Daily Rotate**:

- Daily rotation (YYYY-MM-DD)
- 14 days retention
- Gzip compression
- Max 20MB per file

**Manual Backup**:

```bash
# Copy logs to S3/backup location
aws s3 sync logs/ s3://adminara-logs/$(date +%Y-%m-%d)/
```

### Database Backup (if using PostgreSQL/MongoDB)

**Not applicable**: Current system uses Redis only

---

## 🚨 Disaster Recovery Plan

### RTO/RPO Definitions

**RTO (Recovery Time Objective)**: 15 minutes

- Time to restore service after failure

**RPO (Recovery Point Objective)**: 5 minutes

- Maximum acceptable data loss

### Failover Procedure

**1. Render Service Failure**:

```bash
# Automatic: Render auto-restarts on crash
# Manual: Redeploy via Render dashboard
```

**2. Redis Failure**:

```bash
# Automatic: In-memory fallback activates
# Manual: Restore from RDB/AOF backup
redis-cli --rdb /backup/dump.rdb
```

**3. Complete Outage**:

```bash
# 1. Deploy to backup region (EU/US)
# 2. Update DNS to point to backup
# 3. Restore Redis from backup
# 4. Verify health endpoints
```

### Data Recovery Procedure

**Session Recovery**:

- Sessions lost on Redis failure
- Users must re-login
- Impact: Low (sessions are temporary)

**Log Recovery**:

```bash
# Restore from S3/backup
aws s3 sync s3://adminara-logs/2024-01-15/ logs/
```

**Queue Recovery**:

- In-memory queue: Lost on restart
- Redis queue: Restore from AOF
- Impact: Medium (pending notifications lost)

### Monitoring & Alerts

**Health Checks**:

- `/health`: Every 30s
- `/ready`: Every 10s
- Metrics: Every 15s

**Alert Thresholds**:

- Error rate > 5%: WARNING
- Error rate > 10%: CRITICAL
- Response time > 2s: WARNING
- Memory > 400MB: WARNING

**Notification Channels**:

- Telegram: Admin notifications
- Sentry: Error tracking
- Prometheus: Metrics alerts

---

## 📋 Backup Checklist

### Daily

- [ ] Verify log rotation
- [ ] Check disk space
- [ ] Monitor error rates

### Weekly

- [ ] Redis backup (if applicable)
- [ ] Review Sentry errors
- [ ] Check security scan results

### Monthly

- [ ] Test disaster recovery
- [ ] Review backup retention
- [ ] Update documentation

---

## 🔧 Automated Backup Scripts

### Docker Compose Backup (Recommended)

```bash
# 1. Set environment variables
export BACKUP_ENCRYPTION_KEY="your-secure-key"
export RETENTION_DAYS="7"

# 2. Start backup service
docker-compose -f docker-compose.backup.yml up -d

# 3. View backup logs
docker logs -f adminara-backup

# 4. Manual backup
docker exec adminara-backup /scripts/backup.sh
```

### Native Setup (Linux/macOS)

```bash
# 1. Make scripts executable
chmod +x scripts/backup.sh scripts/restore.sh

# 2. Set environment variables
export BACKUP_DIR="/backups/adminara"
export BACKUP_ENCRYPTION_KEY="your-secure-key"
export REDIS_HOST="localhost"
export RETENTION_DAYS="7"

# 3. Setup cron job (daily at 2 AM)
bash scripts/backup-cron.sh

# 4. Manual backup
bash scripts/backup.sh
```

### Restore from Backup

```bash
# Restore Redis
bash scripts/restore.sh /backups/adminara/redis_20240101_020000.rdb.gz

# Restore Config (encrypted)
export BACKUP_ENCRYPTION_KEY="your-secure-key"
bash scripts/restore.sh /backups/adminara/config_20240101_020000.tar.gz.enc

# Restore Logs
bash scripts/restore.sh /backups/adminara/logs_20240101_020000.tar.gz
```

### Manual Backup Commands

```bash
# Manual Redis backup
redis-cli BGSAVE

# Copy logs to backup
tar -czf logs-$(date +%Y%m%d).tar.gz logs/

# Test restore
redis-cli --rdb /backup/dump.rdb
redis-cli PING

# Verify health
curl https://adminara.onrender.com/health
curl https://adminara.onrender.com/ready
```

---

## 📊 Backup Status

| Component | Backup       | Frequency | Retention | Automation | Status |
| --------- | ------------ | --------- | --------- | ---------- | ------ |
| Redis     | RDB/AOF      | Daily     | 7 days    | Cron       | ✅     |
| Logs      | Daily Rotate | Daily     | 14 days   | Winston    | ✅     |
| Config    | Encrypted    | Daily     | 7 days    | Cron       | ✅     |
| Sessions  | In-Memory    | N/A       | TTL       | Auto       | ✅     |
| Queue     | In-Memory    | N/A       | N/A       | Auto       | ✅     |

**Backup Scripts**: `scripts/backup.sh`, `scripts/restore.sh`
**Cron Setup**: `scripts/backup-cron.sh`
**Last Updated**: 2024
**Next Review**: Monthly

## 🔐 Security Notes

**Encryption**:
- Config backups encrypted with AES-256-CBC
- Set `BACKUP_ENCRYPTION_KEY` environment variable
- Never commit encryption keys to git

**Access Control**:
- Backup directory: 700 permissions
- Backup files: 600 permissions
- Cron logs: 644 permissions

**Best Practices**:
- Store backups on separate server/cloud
- Test restore procedure monthly
- Monitor backup success/failure
- Rotate encryption keys annually
