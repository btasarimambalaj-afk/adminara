require('dotenv').config();
const config = require('./config');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const { initSentry, Sentry } = require('./utils/sentry');
const stateStore = require('./utils/state-store');
const telegramQueue = require('./jobs/telegram');

const COOKIE_SECRET = config.COOKIE_SECRET;

if (config.isProduction && !process.env.COOKIE_SECRET) {
  logger.warn('COOKIE_SECRET not set, generated random secret (will change on restart)');
}

const app = express();
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));
initSentry(app);

// TURN config (static or REST) - using config values
const TURN_SERVER_URL = config.TURN_SERVER_URL;
const TURN_USERNAME = config.TURN_USERNAME;
const TURN_CREDENTIAL = config.TURN_CREDENTIAL;
const TURN_MODE = config.TURN_MODE;
const TURN_SECRET = config.TURN_SECRET;

function buildIceServersForClient(adminId = 'admin') {
  const ice = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  if (!TURN_SERVER_URL) return { iceServers: ice };

  if (TURN_MODE === 'rest' && TURN_SECRET) {
    const ttlSecs = config.TURN_TTL || 300; // 5 minutes (was 3600)
    const username = `${Math.floor(Date.now() / 1000) + ttlSecs}:${adminId}`;
    const hmac = crypto.createHmac('sha1', TURN_SECRET);
    hmac.update(username);
    const credential = hmac.digest('base64');
    ice.push({ urls: TURN_SERVER_URL, username, credential });
    logger.info('TURN credentials generated', { ttl: ttlSecs, expiresAt: Math.floor(Date.now() / 1000) + ttlSecs });
  } else if (TURN_USERNAME && TURN_CREDENTIAL) {
    ice.push({ urls: TURN_SERVER_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL });
  }
  return { iceServers: ice };
}

// Sentry request handler (must be first)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CORS configuration
const originGuard = require('./utils/origin-guard');

const corsOptions = {
  origin(origin, callback) {
    return originGuard.isAllowed(origin, originGuard.corsWhitelist)
      ? callback(null, origin)
      : callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
};

async function initializeApp() {
  await stateStore.init();
  telegramQueue.init();
  
  // Initialize job scheduler
  const scheduler = require('./jobs/scheduler');
  await scheduler.initScheduler();
  
  logger.info('State store, queue, and scheduler initialized');
}

const io = socketIO(server, { 
  cors: corsOptions,
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      process.env.PUBLIC_URL,
      'https://adminara.onrender.com',
      'http://localhost:3000'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Rejected origin:', origin);
      callback('Origin not allowed', false);
    }
  },
  perMessageDeflate: {
    threshold: 0,
    zlibDeflateOptions: { level: 9 },
    zlibInflateOptions: { chunkSize: 10 * 1024 },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10
  },
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6
});

const { bot } = require('./utils/telegram-bot');
if (!bot) {
  logger.warn('⚠️ Telegram bot not configured - OTP will not be sent!');
} else if (!process.env.TELEGRAM_ADMIN_CHAT_ID) {
  logger.warn('⚠️ TELEGRAM_ADMIN_CHAT_ID not set - OTP will not be sent!');
} else {
  logger.info('✅ Telegram bot configured and ready');
}

// Middleware
app.enable('trust proxy');
app.use(compression());

app.use((req, res, next) => {
  res.locals.cspNonce = require('crypto').randomBytes(16).toString('base64');
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, "https://www.googletagmanager.com"],
      styleSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "wss:", "https:", "stun:", "turn:"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors(corsOptions));

// HTTPS enforce (production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

// Rate limiting
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    skip: (req) => req.path === '/health' || req.path === '/ready',
    standardHeaders: true,
    legacyHeaders: false,
    // Trust proxy - use leftmost IP from X-Forwarded-For
    validate: { trustProxy: false }
  });
  app.use(limiter);
}

// State
let adminSocket = null;
let customerSockets = new Map();
let channelStatus = 'AVAILABLE';
let otpStore = new Map();
let connectionCount = 0;
let roomTimeout = null;
const ROOM_TIMEOUT_MS = parseInt(process.env.ROOM_TIMEOUT_MS) || 60000;

// OTP cleanup interval
const otpCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [socketId, data] of otpStore.entries()) {
    if (data.expires < now) {
      otpStore.delete(socketId);
      logger.info('OTP expired and cleaned', { socketId });
    }
  }
  adminSession.cleanupExpiredSessions();
}, 60000);

// State object with Proxy pattern for debugging
const stateTarget = {
  adminSocket,
  customerSockets,
  channelStatus,
  otpStore,
  connectionCount,
  bot
};

const state = new Proxy(stateTarget, {
  set(target, prop, value) {
    if (process.env.DEBUG_STATE === 'true') {
      logger.debug('State changed', { prop, oldValue: target[prop], newValue: value });
    }
    target[prop] = value;
    return true;
  },
  get(target, prop) {
    return target[prop];
  }
});

// Metrics origin guard (CRITICAL security fix)
function metricsOriginGuard(req, res, next) {
  const origin = String(req.headers.origin || '');
  const referer = String(req.headers.referer || '');
  const whitelist = originGuard.metricsWhitelist;

  if (!originGuard.isAllowed(origin, whitelist) && !originGuard.isAllowed(referer, whitelist)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}

// Metrics endpoints (protected)
app.post('/metrics/reconnect-attempt', metricsOriginGuard, (req, res) => {
  metrics.webrtcReconnectAttempts.inc();
  res.sendStatus(204);
});

app.post('/metrics/reconnect-success', metricsOriginGuard, (req, res) => {
  metrics.webrtcReconnectSuccess.inc();
  const duration = Number(req.body?.duration);
  if (!Number.isNaN(duration)) {
    metrics.webrtcReconnectDuration.observe(duration);
  }
  res.sendStatus(204);
});

app.post('/metrics/reconnect-failure', metricsOriginGuard, (req, res) => {
  metrics.webrtcReconnectFailures.inc();
  res.sendStatus(204);
});

app.post('/metrics/turn-selected', metricsOriginGuard, (req, res) => {
  metrics.turnSelected.inc();
  res.sendStatus(204);
});

app.post('/metrics/candidate-type', metricsOriginGuard, (req, res) => {
  const t = String(req.body?.type || '').toLowerCase();
  if (t === 'host' || t === 'srflx' || t === 'relay') {
    metrics.candidateByType.inc({ type: t });
  }
  res.sendStatus(204);
});

// Session helpers
const adminSession = require('./utils/admin-session');
const { celebrate, Joi, errors } = require('celebrate');

module.exports.COOKIE_SECRET = COOKIE_SECRET;

function setSessionCookie(res, token, ttl = adminSession.SESSION_TTL_MS) {
  const prod = process.env.NODE_ENV === 'production';
  res.cookie('adminSession', token, {
    httpOnly: true,
    secure: prod,
    sameSite: 'Strict',
    maxAge: ttl,
    path: '/'
  });
}

const { createOtpForAdmin, verifyAdminOtp } = require('./socket/admin-auth');

app.post('/admin/otp/request', celebrate({
  body: Joi.object({
    adminId: Joi.string().trim().max(64).default('admin')
  })
}), async (req, res) => {
  const adminId = String(req.body?.adminId || 'admin');
  logger.info('OTP request received', { adminId, botConfigured: !!bot, chatId: process.env.TELEGRAM_ADMIN_CHAT_ID });
  try {
    await createOtpForAdmin(adminId, bot);
    logger.info('OTP creation completed');
    res.sendStatus(204);
  } catch (err) {
    logger.error('OTP request failed', { err: err.message });
    res.status(500).json({ error: 'OTP send failed' });
  }
});

app.post('/admin/otp/verify', celebrate({
  body: Joi.object({
    adminId: Joi.string().trim().max(64).default('admin'),
    code: Joi.string().pattern(/^\d{6}$/).required()
  })
}), async (req, res) => {
  const adminId = String(req.body?.adminId || 'admin');
  const code = String(req.body?.code || '');
  const ok = verifyAdminOtp(adminId, code);
  if (!ok) return res.status(401).json({ ok: false, error: 'invalid_otp' });
  const token = await adminSession.createSession(adminId);
  setSessionCookie(res, token);
  res.sendStatus(204);
});

app.get('/admin/session/verify', async (req, res) => {
  const t = req.cookies?.adminSession;
  const session = await adminSession.validateSession(t);
  if (!session) return res.status(401).json({ ok: false });
  res.json({ ok: true });
});

app.post('/admin/logout', async (req, res) => {
  const t = req.cookies?.adminSession;
  if (t) await adminSession.revokeSession(t);
  res.clearCookie('adminSession', { path: '/' });
  res.sendStatus(204);
});

// Middleware
const { correlationMiddleware } = require('./routes/middleware/correlation');
app.use(correlationMiddleware);

// Routes (BEFORE static files)
app.use('/', require('./routes')(state));

// Static files (AFTER routes)
app.use('/js', express.static('public/js', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));
app.use(express.static('public'));

// V1 API Routes
const adminRoutes = require('./routes/v1/admin');
const customerRoutes = require('./routes/v1/customer');

app.use('/v1/admin', adminRoutes);
app.use('/v1/customer', customerRoutes);

// Make state and io available to routes
app.set('state', state);
app.set('io', io);

// Celebrate error handler
app.use(errors());

// OTP attempts tracking
const otpAttempts = new Map();
state.otpAttempts = otpAttempts;

// CSRF Protection (optional)
const { validateCSRF } = require('./utils/middleware');
if (process.env.ENABLE_CSRF === 'true') {
  io.use((socket, next) => validateCSRF(socket, next));
  logger.info('CSRF protection enabled');
}

// Socket.IO admin cookie guard
io.use(async (socket, next) => {
  const isAdmin = socket.handshake?.auth?.isAdmin === true || socket.handshake?.query?.role === 'admin';
  if (!isAdmin) return next();
  try {
    const raw = socket.request.headers.cookie || '';
    const token = (raw.match(/(?:^|; )adminSession=([^;]+)/)||[])[1];
    const session = await adminSession.validateSession(decodeURIComponent(token));
    if (!session) {
      return next(new Error('unauthorized'));
    }
    return next();
  } catch {
    return next(new Error('unauthorized'));
  }
});

// Socket handlers
const socketHandlers = require('./socket/handlers');
const adminAuthHandlers = require('./socket/admin-auth');

io.on('connection', (socket) => {
  const maxConnections = parseInt(process.env.MAX_CONNECTIONS) || 50;
  
  if (state.connectionCount >= maxConnections) {
    logger.warn('Max connections reached', { current: state.connectionCount, max: maxConnections });
    socket.emit('error', { message: 'Server capacity reached' });
    socket.disconnect();
    return;
  }
  
  state.connectionCount++;
  metrics.socketConnections.set(state.connectionCount);
  logger.info('New connection', { socketId: socket.id, total: state.connectionCount });
  
  // WebSocket failover support
  socket.on('reconnect:transfer', async (data) => {
    const bridge = require('./utils/bridge');
    const success = await bridge.failoverWebSocket(data.oldSocketId, socket.id, state);
    socket.emit('reconnect:transferred', { success });
  });

  socketHandlers(io, socket, state);
  adminAuthHandlers(io, socket, state);
});

// Error handlers
app.use((req, res) => {
  res.status(404).sendFile(__dirname + '/public/404.html');
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message });
  res.status(500).sendFile(__dirname + '/public/500.html');
});

// Graceful shutdown
let gracefulShutdown = async (signal) => {
  logger.info('Graceful shutdown started', { signal });
  
  clearInterval(otpCleanupInterval);
  
  // Shutdown job scheduler
  const scheduler = require('./jobs/scheduler');
  await scheduler.shutdownScheduler();
  
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  io.emit('server:shutdown', { message: 'Server restarting' });
  io.close(() => {
    logger.info('Socket.IO closed');
  });
  
  if (state.adminSocket) state.adminSocket.disconnect();
  state.customerSockets.forEach(socket => socket.disconnect());
  
  setTimeout(() => {
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, async () => {
  await initializeApp();
  logger.info('Server started', { port: PORT });
  logger.info('Customer URL', { url: process.env.PUBLIC_URL || `http://localhost:${PORT}` });
  logger.info('Admin URL', { url: `${process.env.PUBLIC_URL || `http://localhost:${PORT}`}/admin` });
  logger.info('Health URL', { url: `${process.env.PUBLIC_URL || `http://localhost:${PORT}`}/health` });
  logger.info('Telegram config', { 
    botConfigured: !!bot, 
    chatIdConfigured: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0
  });
  
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const pingUrl = process.env.RENDER_EXTERNAL_URL;
    const pingInterval = parseInt(process.env.PING_INTERVAL) || 240000;
    logger.info('Keep-alive enabled', { url: pingUrl, interval: `${pingInterval/1000}s` });
    
    const keepAliveInterval = setInterval(async () => {
      try {
        const https = require('https');
        https.get(`${pingUrl}/health`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              logger.debug('Ping OK', { uptime: Math.floor(json.uptime) });
            } catch (e) {
              logger.debug('Ping OK');
            }
          });
        }).on('error', (error) => {
          logger.error('Ping error', { error: error.message });
        });
      } catch (error) {
        logger.error('Ping error', { error: error.message });
      }
    }, pingInterval);
    
    // Cleanup on shutdown
    const originalShutdown = gracefulShutdown;
    gracefulShutdown = (signal) => {
      clearInterval(keepAliveInterval);
      originalShutdown(signal);
    };
  }
});
