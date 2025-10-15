#!/bin/sh
set -e

echo "🐳 AdminAra Docker Backup Service Starting..."

# Install required packages
apk add --no-cache redis bash openssl tar gzip

# Create backup directory
mkdir -p /backups

# Setup cron job (daily at 2 AM)
echo "0 2 * * * cd /app && /scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# Create log file
touch /var/log/backup.log
chmod 644 /var/log/backup.log

echo "✅ Backup service configured"
echo "📋 Schedule: Daily at 2:00 AM"
echo "📁 Backup directory: /backups"
echo "📊 Retention: ${RETENTION_DAYS:-7} days"

# Start cron in foreground
exec crond -f -l 2
