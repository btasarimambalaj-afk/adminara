#!/bin/bash
set -e

BACKUP_FILE=$1
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  echo ""
  echo "Examples:"
  echo "  ./restore.sh /backups/adminara/redis_20240101_020000.rdb.gz"
  echo "  ./restore.sh /backups/adminara/config_20240101_020000.tar.gz.enc"
  echo "  ./restore.sh /backups/adminara/logs_20240101_020000.tar.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "🔄 AdminAra Restore Started"
echo "📁 Backup file: $BACKUP_FILE"

# Restore Redis
if [[ $BACKUP_FILE == *"redis"* ]]; then
  echo "📦 Restoring Redis..."
  gunzip -c "$BACKUP_FILE" > /tmp/dump.rdb
  
  # Stop Redis, restore, restart
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SHUTDOWN NOSAVE 2>/dev/null || echo "Redis already stopped"
  sleep 2
  
  # Copy dump to Redis data directory
  REDIS_DIR="${REDIS_DIR:-/var/lib/redis}"
  cp /tmp/dump.rdb "$REDIS_DIR/dump.rdb"
  rm /tmp/dump.rdb
  
  # Restart Redis (systemd)
  systemctl start redis 2>/dev/null || echo "⚠️  Manual Redis restart required"
  
  echo "✅ Redis restore completed"
fi

# Restore Config (encrypted)
if [[ $BACKUP_FILE == *"config"* ]] && [[ $BACKUP_FILE == *".enc" ]]; then
  echo "🔐 Restoring encrypted config..."
  
  if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
    echo "❌ BACKUP_ENCRYPTION_KEY not set"
    exit 1
  fi
  
  openssl enc -aes-256-cbc -d -salt -k "$BACKUP_ENCRYPTION_KEY" -in "$BACKUP_FILE" | tar -xzf -
  echo "✅ Config restore completed (encrypted)"
fi

# Restore Config (unencrypted)
if [[ $BACKUP_FILE == *"config"* ]] && [[ $BACKUP_FILE != *".enc" ]]; then
  echo "🔐 Restoring config..."
  tar -xzf "$BACKUP_FILE"
  echo "✅ Config restore completed"
fi

# Restore Logs
if [[ $BACKUP_FILE == *"logs"* ]]; then
  echo "📋 Restoring logs..."
  tar -xzf "$BACKUP_FILE"
  echo "✅ Logs restore completed"
fi

echo "✅ Restore completed successfully"
echo "⚠️  Remember to restart the application if config was restored"
