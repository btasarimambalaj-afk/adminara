require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

const TZ = 'Europe/Istanbul';
const REPORTS_DIR = path.join(__dirname, 'reports');

// Telegram notification helper
async function sendTelegramNotification(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_ADMIN_CHAT_ID) {
    logger.warn('Telegram not configured, skipping notification');
    return false;
  }

  try {
    const https = require('https');
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const data = JSON.stringify({
      chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
      text
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, res => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode === 200));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  } catch (e) {
    logger.error('Telegram send failed', { error: e.message });
    return false;
  }
}

// Run tests and get results
async function runTests() {
  try {
    execSync('node scripts/test-runner-simple.js', {
      cwd: __dirname,
      timeout: 30000,
      stdio: 'inherit'
    });

    const resultsPath = path.join(REPORTS_DIR, 'test_results.json');
    if (fs.existsSync(resultsPath)) {
      return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }
    return null;
  } catch (e) {
    logger.error('Test execution failed', { error: e.message });
    return null;
  }
}

// Telegram proxy endpoint
app.post('/api/telegram/send', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ ok: false, error: 'Missing text' });

  const success = await sendTelegramNotification(text);
  res.json({ ok: success });
});

// Test run endpoint
app.post('/api/run-tests', async (req, res) => {
  const results = await runTests();
  if (!results) {
    return res.status(500).json({ error: 'Test execution failed' });
  }
  res.json(results);
});

// Schedule tests at 10:00, 14:00, 20:00, 23:00 (Europe/Istanbul)
const schedules = [
  { time: '0 10 * * *', label: '10:00' },
  { time: '0 14 * * *', label: '14:00' },
  { time: '0 20 * * *', label: '20:00' },
  { time: '0 23 * * *', label: '23:00' }
];

schedules.forEach(({ time, label }) => {
  cron.schedule(time, async () => {
    logger.info(`Running scheduled tests at ${label}`);
    const results = await runTests();
    
    if (results && results.summary) {
      const msg = `✅ Otomatik Test Raporu
Saat: ${new Date().toLocaleString('tr-TR', { timeZone: TZ })}

Passed: ${results.summary.passed}
Failed: ${results.summary.failed}
Total: ${results.summary.total}
Duration: ${results.summary.duration}
Coverage: ${results.summary.coverage}

Not: Ayrıntılar için test_report.md`;

      await sendTelegramNotification(msg);
      logger.info('Scheduled test completed and notification sent');
    }
  }, { timezone: TZ });
  
  logger.info(`Scheduled test at ${label} (${TZ})`);
});

const PORT = process.env.CRON_PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Cron server running on port ${PORT}`);
  logger.info('Scheduled times: 10:00, 14:00, 20:00, 23:00 (Europe/Istanbul)');
});
