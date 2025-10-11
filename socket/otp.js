const crypto = require('crypto');
const logger = require('../utils/logger');
const authManager = require('../utils/auth');
const { schemas, validate } = require('../utils/validation');

module.exports = (socket, state) => {
  const { otpStore, otpAttempts, bot } = state;

  socket.on('admin:otp:request', async () => {
    try {
      const otp = crypto.randomInt(100000, 999999).toString();
      otpStore.set(socket.id, { otp, expires: Date.now() + 300000 });
      
      if (bot && process.env.TELEGRAM_ADMIN_CHAT_ID) {
        const adminUrl = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/admin` : `http://localhost:${process.env.PORT || 3000}/admin`;
        bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, `🔐 Admin OTP: ${otp}\n⏰ 5 dakika geçerli\n\n👨💼 Admin Paneli:\n${adminUrl}`);
      }
      
      socket.emit('admin:otp:sent');
      logger.info('OTP sent', { socketId: socket.id });
    } catch (error) {
      logger.error('OTP request error', { error: error.message });
    }
  });

  socket.on('admin:session:verify', (data) => {
    try {
      const { token } = data;
      if (!token) {
        socket.emit('admin:session:invalid');
        return;
      }
      
      const session = authManager.validateSession(token);
      if (session && session.expires > Date.now()) {
        socket.emit('admin:session:valid');
        logger.info('Session validated', { socketId: socket.id });
      } else {
        socket.emit('admin:session:invalid');
        logger.info('Session invalid or expired', { socketId: socket.id });
      }
    } catch (error) {
      logger.error('Session verify error', { error: error.message });
      socket.emit('admin:session:invalid');
    }
  });

  socket.on('admin:otp:verify', async (data) => {
    try {
      const { otp } = validate(schemas.otp, data);
      const attempts = otpAttempts.get(socket.id) || { count: 0, lockedUntil: 0 };
      
      if (attempts.lockedUntil > Date.now()) {
        const retryAfter = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        socket.emit('admin:otp:locked', { message: `Çok fazla hatalı deneme. ${retryAfter} saniye sonra tekrar deneyin.`, retryAfter });
        return;
      }
      
      const stored = otpStore.get(socket.id);
      
      if (!stored || stored.expires < Date.now()) {
        socket.emit('admin:otp:invalid', { message: 'OTP süresi dolmuş' });
        return;
      }
      
      if (stored.otp === otp) {
        otpStore.delete(socket.id);
        otpAttempts.delete(socket.id);
        const token = authManager.createSession(socket.id);
        socket.emit('admin:otp:verified', { token });
        logger.info('OTP verified', { socketId: socket.id });
      } else {
        attempts.count++;
        if (attempts.count >= 5) {
          attempts.lockedUntil = Date.now() + 300000;
          attempts.count = 0;
        }
        otpAttempts.set(socket.id, attempts);
        socket.emit('admin:otp:invalid', { message: 'Geçersiz OTP', attemptsLeft: Math.max(0, 5 - attempts.count) });
      }
    } catch (error) {
      logger.error('OTP verify error', { error: error.message });
      socket.emit('error', { message: 'Invalid request' });
    }
  });
};
