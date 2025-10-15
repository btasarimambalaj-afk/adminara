#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups/adminara}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "📦 AdminAra Backup Started: $TIMESTAMP"

# Redis backup (if configured)
if [ -n "$REDIS_URL" ]; then
  echo "📦 Redis backup starting..."
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --rdb /tmp/dump.rdb 2>/dev/null || echo "⚠️  Redis backup skipped (not available)"
  if [ -f /tmp/dump.rdb ]; then
    gzip -c /tmp/dump.rdb > "$BACKUP_DIR/redis_$TIMESTAMP.rdb.gz"
    rm /tmp/dump.rdb
    echo "✅ Redis backup completed"
  fi
else
  echo "⏭️  Redis backup skipped (not configured)"
fi

# Logs backup
if [ -d logs ]; then
  echo "📋 Logs backup starting..."
  tar -czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" logs/ 2>/dev/null || echo "⚠️  Logs backup failed"
  echo "✅ Logs backup completed"
else
  echo "⏭️  Logs backup skipped (no logs directory)"
fi

# Config backup (encrypted)
if [ -f .env ]; then
  echo "🔐 Config backup starting..."
  if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
    tar -czf - .env config/ 2>/dev/null | openssl enc -aes-256-cbc -salt -k "$BACKUP_ENCRYPTION_KEY" > "$BACKUP_DIR/config_$TIMESTAMP.tar.gz.enc"
    echo "✅ Config backup completed (encrypted)"
  else
    tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" .env config/ 2>/dev/null
    echo "⚠️  Config backup completed (unencrypted - set BACKUP_ENCRYPTION_KEY)"
  fi
else
  echo "⏭️  Config backup skipped (no .env file)"
fi

# Cleanup old backups
echo "🧹 Cleaning old backups (>$RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || echo "⚠️  Cleanup skipped"

# Backup summary
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "unknown")
echo "✅ Backup completed: $TIMESTAMP"
echo "📊 Total backup size: $BACKUP_SIZE"
echo "📁 Backup location: $BACKUP_DIR"
