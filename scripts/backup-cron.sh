#!/bin/bash
# AdminAra Backup Cron Job Setup
# Run: sudo bash scripts/backup-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/adminara-backup.log"

echo "Setting up AdminAra backup cron job..."

# Create log file
sudo touch "$LOG_FILE"
sudo chmod 644 "$LOG_FILE"

# Make backup script executable
chmod +x "$SCRIPT_DIR/backup.sh"
chmod +x "$SCRIPT_DIR/restore.sh"

# Add cron job (daily at 2 AM)
CRON_JOB="0 2 * * * cd $APP_DIR && $SCRIPT_DIR/backup.sh >> $LOG_FILE 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
  echo "⚠️  Cron job already exists"
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "✅ Cron job added: Daily backup at 2 AM"
fi

echo ""
echo "📋 Cron job details:"
echo "   Schedule: Daily at 2:00 AM"
echo "   Script: $SCRIPT_DIR/backup.sh"
echo "   Log: $LOG_FILE"
echo ""
echo "📝 To view cron jobs: crontab -l"
echo "📝 To view backup logs: tail -f $LOG_FILE"
echo "📝 To remove cron job: crontab -e (then delete the line)"
