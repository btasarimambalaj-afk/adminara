require('dotenv').config();

console.log('=== TELEGRAM CONFIG TEST ===');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'SET (length: ' + process.env.TELEGRAM_BOT_TOKEN.length + ')' : 'NOT SET');
console.log('TELEGRAM_ADMIN_CHAT_ID:', process.env.TELEGRAM_ADMIN_CHAT_ID || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === 'demo-token') {
  console.error('❌ TELEGRAM_BOT_TOKEN not configured!');
  process.exit(1);
}

if (!process.env.TELEGRAM_ADMIN_CHAT_ID) {
  console.error('❌ TELEGRAM_ADMIN_CHAT_ID not configured!');
  process.exit(1);
}

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

console.log('\n=== SENDING TEST MESSAGE ===');
bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, '🧪 Test mesajı - Telegram bot çalışıyor!')
  .then(() => {
    console.log('✅ Telegram message sent successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Telegram send failed:', err.message);
    process.exit(1);
  });
