const crypto = require('crypto');
const logger = require('../utils/logger');
const adminSession = require('../utils/admin-session');
const rateLimiter = require('../utils/rate-limiter');
const metrics = require('../utils/metrics');

const adminPasswordStore = new Map();
const failedAttempts = new Map();

const OTP_REQUEST_LIMIT = parseInt(process.env.OTP_REQUEST_LIMIT) || 5;
const OTP_REQUEST_WINDOW = parseInt(process.env.OTP_REQUEST_WINDOW) || 900000;
const OTP_FAIL_LIMIT = parseInt(process.env.OTP_FAIL_LIMIT) || 5;
const OTP_LOCKOUT_DURATION = parseInt(process.env.OTP_LOCKOUT_DURATION) || 900000;
const ENABLE_OTP_RATE_LIMIT = process.env.ENABLE_OTP_RATE_LIMIT !== 'false';

async function generateAndSendOTP(socket, bot) {
  const password = crypto.randomInt(100000, 999999).toString();
  adminPasswordStore.set(socket.id, {
    password,
    expires: Date.now() + 300000,
  });

  if (bot && process.env.TELEGRAM_ADMIN_CHAT_ID) {
    try {
      await bot.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        `🔐 Admin Panel Şifresi: ${password}\n⏰ 5 dakika geçerli\n\n👨💼 Admin Paneli:\n${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin.html`
      );
      logger.info('OTP sent via Telegram', { socketId: socket.id });
    } catch (err) {
      logger.error('Telegram OTP send failed', { err: err.message });
    }
  } else {
    logger.warn('Telegram not configured', {
      bot: !!bot,
      chatId: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    });
  }

  socket.emit('admin:password:sent');
  logger.info('Admin password sent', { socketId: socket.id });
}

async function createOtpForAdmin(adminId, bot) {
  const password = crypto.randomInt(100000, 999999).toString();
  const data = { password, expires: Date.now() + 300000 };

  const stateStore = require('../utils/state-store');
  await stateStore.setOtp(adminId, data);
  adminPasswordStore.set(adminId, data);

  if (bot && process.env.TELEGRAM_ADMIN_CHAT_ID) {
    try {
      await bot.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        `🔐 Admin Panel Şifresi: ${password}\n⏰ 5 dakika geçerli\n\n👨💼 Admin Paneli:\n${process.env.PUBLIC_URL || 'http://localhost:3000'}/admin.html`
      );
      logger.info('OTP sent via Telegram', { adminId });
    } catch (err) {
      logger.error('Telegram OTP send failed', { err: err.message });
      throw err;
    }
  } else {
    logger.warn('Telegram not configured', {
      bot: !!bot,
      chatId: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    });
  }
  return data;
}

function verifyAdminOtp(adminId, code) {
  const stored = adminPasswordStore.get(adminId);
  if (!stored || stored.expires < Date.now()) return false;
  if (stored.password === code) {
    adminPasswordStore.delete(adminId);
    failedAttempts.delete(adminId);
    return true;
  }

  const attempts = (failedAttempts.get(adminId) || 0) + 1;
  failedAttempts.set(adminId, attempts);
  metrics.otpInvalidAttempts.inc();

  return false;
}

module.exports = (io, socket, state) => {
  const { bot } = state;

  // IP Whitelist (optional)
  const ADMIN_IPS = process.env.ADMIN_IPS?.split(',').map(ip => ip.trim()) || [];
  if (ADMIN_IPS.length > 0 && !ADMIN_IPS.includes(socket.handshake.address)) {
    logger.warn('Admin access denied - IP not whitelisted', { ip: socket.handshake.address });
    socket.emit('admin:unauthorized', { message: 'IP not authorized' });
    socket.disconnect();
    return;
  }

  socket.on('admin:session:verify', async data => {
    try {
      const { token } = data;
      if (!token) {
        socket.emit('admin:session:invalid');
        return;
      }

      const session = await adminSession.validateSession(token);
      if (session) {
        socket.emit('admin:session:valid');
        logger.info('Session validated - auto-joining room', { socketId: socket.id });

        if (socket.handleRoomJoin) {
          socket.handleRoomJoin(socket, { isAdmin: true });
        }
      } else {
        socket.emit('admin:session:invalid');
        logger.info('Session invalid or expired', { socketId: socket.id });
      }
    } catch (error) {
      logger.error('Session verify error', { error: error.message });
      socket.emit('admin:session:invalid');
    }
  });

  socket.on('admin:password:request', async () => {
    const stateStore = require('../utils/state-store');
    await stateStore.setOtp(socket.id, {
      password: crypto.randomInt(100000, 999999).toString(),
      expires: Date.now() + 300000,
    });
    await generateAndSendOTP(socket, bot);
  });

  socket.on('admin:password:verify', async data => {
    try {
      const { password } = data;
      const stored = adminPasswordStore.get(socket.id);

      if (!stored || stored.expires < Date.now()) {
        socket.emit('admin:password:invalid', { message: 'Şifre süresi dolmuş' });
        return;
      }

      if (stored.password === password) {
        adminPasswordStore.delete(socket.id);
        failedAttempts.delete(socket.id);
        const token = await adminSession.createSession('admin');
        socket.emit('admin:password:verified', { token });
        logger.info('Admin password verified - auto-joining room', { socketId: socket.id });

        if (socket.handleRoomJoin) {
          socket.handleRoomJoin(socket, { isAdmin: true });
        }
      } else {
        if (ENABLE_OTP_RATE_LIMIT) {
          const attempts = (failedAttempts.get(socket.id) || 0) + 1;
          failedAttempts.set(socket.id, attempts);
          metrics.otpInvalidAttempts.inc();

          if (attempts >= OTP_FAIL_LIMIT) {
            const lockKey = `otp_fail_${socket.id}`;
            await rateLimiter.lockout(lockKey, OTP_LOCKOUT_DURATION, 'failed_attempts');
            metrics.otpLockouts.inc({ reason: 'failures' });
            failedAttempts.delete(socket.id);

            socket.emit('admin:password:locked', {
              message: `Çok fazla hatalı deneme. ${Math.ceil(OTP_LOCKOUT_DURATION / 1000 / 60)} dakika sonra tekrar deneyin.`,
              retryAfter: Math.ceil(OTP_LOCKOUT_DURATION / 1000),
            });
            logger.warn('OTP locked due to failed attempts', { socketId: socket.id });
            return;
          }
        }
        socket.emit('admin:password:invalid', { message: 'Geçersiz şifre' });
      }
    } catch (error) {
      logger.error('Admin password verify error', { error: error.message });
      socket.emit('admin:password:invalid', { message: 'Hata oluştu' });
    }
  });

  socket.on('disconnect', () => {
    adminPasswordStore.delete(socket.id);
  });
};

module.exports.createOtpForAdmin = createOtpForAdmin;
module.exports.verifyAdminOtp = verifyAdminOtp;
