const cron = require('node-cron');
const { execSync } = require('child_process');
const config = require('./schedule.config.json');

if (!config.enable) {
  console.log('⚠️ Scheduler disabled in config');
  process.exit(0);
}

console.log(`🕐 Scheduler started (${config.timezone})`);
console.log(`📅 Times: ${config.times.join(', ')}`);

config.times.forEach(time => {
  const [hour, minute] = time.split(':');
  const cronExp = `${minute} ${hour} * * *`;
  
  cron.schedule(cronExp, () => {
    console.log(`\n🚀 Running scheduled tests at ${time}...`);
    try {
      execSync('node scripts/test-runner.js', { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ Scheduled test failed:', e.message);
    }
  }, { timezone: config.timezone });
  
  console.log(`✅ Scheduled: ${time} (${cronExp})`);
});

console.log('\n⏳ Waiting for scheduled times...\n');
