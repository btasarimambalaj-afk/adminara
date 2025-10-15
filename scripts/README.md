# AdminAra Backup Scripts

Automated backup and restore scripts for Redis, logs, and configuration files.

## Deployment Options

### Option 1: Docker Compose (Recommended)

Use `docker-compose.backup.yml` for containerized backup service.

**Features**:
- Automated daily backups (2 AM)
- Redis container included
- Isolated backup environment
- Easy scaling and monitoring

**Usage**:
```bash
# Start backup service
docker-compose -f docker-compose.backup.yml up -d

# View logs
docker logs -f adminara-backup

# Manual backup
docker exec adminara-backup /scripts/backup.sh

# Stop service
docker-compose -f docker-compose.backup.yml down
```

### Option 2: Native Scripts

Use bash scripts directly on Linux/macOS.

## Scripts

### backup.sh
Automated backup script for Redis, logs, and config files.

**Features**:
- Redis RDB backup (gzipped)
- Logs archive (tar.gz)
- Config backup (AES-256 encrypted)
- Automatic cleanup (7 days retention)
- Error handling and logging

**Usage**:
```bash
# Set environment variables
export BACKUP_DIR="/backups/adminara"
export BACKUP_ENCRYPTION_KEY="your-secure-key"
export REDIS_HOST="localhost"
export RETENTION_DAYS="7"

# Run backup
bash scripts/backup.sh
```

### restore.sh
Restore script for backups.

**Features**:
- Redis restore from RDB
- Config restore (encrypted/unencrypted)
- Logs restore
- Automatic file type detection

**Usage**:
```bash
# Restore Redis
bash scripts/restore.sh /backups/adminara/redis_20240101_020000.rdb.gz

# Restore encrypted config
export BACKUP_ENCRYPTION_KEY="your-secure-key"
bash scripts/restore.sh /backups/adminara/config_20240101_020000.tar.gz.enc

# Restore logs
bash scripts/restore.sh /backups/adminara/logs_20240101_020000.tar.gz
```

### backup-cron.sh
Setup automated daily backups via cron.

**Features**:
- Creates cron job (daily at 2 AM)
- Sets up log file
- Makes scripts executable

**Usage**:
```bash
sudo bash scripts/backup-cron.sh
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| BACKUP_DIR | Backup directory path | /backups/adminara | No |
| BACKUP_ENCRYPTION_KEY | AES-256 encryption key | - | Yes (for config) |
| REDIS_HOST | Redis server hostname | localhost | No |
| REDIS_PORT | Redis server port | 6379 | No |
| REDIS_URL | Redis connection URL | - | No |
| RETENTION_DAYS | Backup retention days | 7 | No |

## Backup Files

**Naming Convention**:
- Redis: `redis_YYYYMMDD_HHMMSS.rdb.gz`
- Logs: `logs_YYYYMMDD_HHMMSS.tar.gz`
- Config: `config_YYYYMMDD_HHMMSS.tar.gz.enc`

**Example**:
```
/backups/adminara/
├── redis_20240115_020000.rdb.gz
├── logs_20240115_020000.tar.gz
└── config_20240115_020000.tar.gz.enc
```

## Cron Schedule

```bash
# View cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Default schedule: Daily at 2 AM
0 2 * * * cd /opt/adminara && /opt/adminara/scripts/backup.sh >> /var/log/adminara-backup.log 2>&1
```

## Monitoring

**Check backup logs**:
```bash
tail -f /var/log/adminara-backup.log
```

**Check backup size**:
```bash
du -sh /backups/adminara
```

**List recent backups**:
```bash
ls -lht /backups/adminara | head -10
```

## Security

**Encryption**:
- Config backups use AES-256-CBC encryption
- Store encryption key securely (not in git)
- Rotate keys annually

**Permissions**:
```bash
chmod 700 /backups/adminara
chmod 600 /backups/adminara/*
chmod 700 scripts/*.sh
```

**Best Practices**:
- Store backups on separate server/cloud
- Test restore procedure monthly
- Monitor backup success/failure
- Use strong encryption keys (32+ chars)

## Disaster Recovery

**RTO (Recovery Time Objective)**: 15 minutes
**RPO (Recovery Point Objective)**: 24 hours (daily backups)

**Recovery Steps**:
1. Restore Redis: `bash scripts/restore.sh <redis_backup>`
2. Restore Config: `bash scripts/restore.sh <config_backup>`
3. Restart application: `npm start`
4. Verify health: `curl http://localhost:3000/health`

## Troubleshooting

**Redis backup fails**:
- Check Redis is running: `redis-cli PING`
- Check Redis permissions
- Verify REDIS_HOST and REDIS_PORT

**Config restore fails**:
- Verify BACKUP_ENCRYPTION_KEY is correct
- Check file is not corrupted: `file <backup_file>`

**Cron job not running**:
- Check cron service: `systemctl status cron`
- Verify cron job exists: `crontab -l`
- Check log file: `tail /var/log/adminara-backup.log`
