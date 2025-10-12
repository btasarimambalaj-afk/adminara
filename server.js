require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const { initSentry, Sentry } = require('./utils/sentry');

const app = express();
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-secret'));
initSentry(app);

// TURN config (static or REST)
const TURN_URL = process.env.TURN_URL;
const TURN_USER = process.env.TURN_USER;
const TURN_PASS = process.env.TURN_PASS;
const TURN_MODE = process.env.TURN_MODE || 'static';
const TURN_SECRET = process.env.TURN_SECRET;

function buildIceServersForClient(adminId = 'admin') {
  const ice = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  if (!TURN_URL) return { iceServers: ice };

  if (TURN_MODE === 'rest' && TURN_SECRET) {
    const ttlSecs = 3600;
    const username = `${Math.floor(Date.now() / 1000) + ttlSecs}:${adminId}`;
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha1', TURN_SECRET);
    hmac.update(username);
    const credential = hmac.digest('base64');
    ice.push({ urls: TURN_URL, username, credential });
  } else if (TURN_USER && TURN_PASS) {
    ice.push({ urls: TURN_URL, username: TURN_USER, credential: TURN_PASS });
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
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : '*',
  credentials: true
};

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

// Telegram Bot
const bot = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'demo-token'
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

// Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "wss:", "https:", "stun:", "turn:"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'none'"]
    }
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

// Static files with cache control for JS files
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

// Rate limiting
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
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
  require('./utils/auth').cleanupExpiredSessions();
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
  const allowed = [
    process.env.PUBLIC_URL,
    'https://adminara.onrender.com',
    'http://localhost:3000'
  ].filter(Boolean);
  
  const badOrigin = origin && !allowed.some(a => origin.startsWith(a));
  const badReferer = referer && !allowed.some(a => referer.startsWith(a));
  
  if (badOrigin || badReferer) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
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
const { issueToken, validateToken, revokeToken, SESS_TTL_MS } = require('./utils/session');
function setSessionCookie(res, token, ttl = SESS_TTL_MS) {
  const prod = process.env.NODE_ENV === 'production';
  res.cookie('adminSession', token, {
    httpOnly: true,
    secure: prod,
    sameSite: 'Strict',
    maxAge: ttl,
    path: '/'
  });
}

// OTP HTTP endpoints
const { createOtpForAdmin, verifyAdminOtp } = require('./socket/admin-auth');

app.post('/admin/otp/request', (req, res) => {
  const adminId = String(req.body?.adminId || 'admin');
  createOtpForAdmin(adminId, state.bot);
  res.sendStatus(204);
});

app.post('/admin/otp/verify', (req, res) => {
  const adminId = String(req.body?.adminId || 'admin');
  const code = String(req.body?.code || '');
  const ok = verifyAdminOtp(adminId, code);
  if (!ok) return res.status(401).json({ ok: false, error: 'invalid_otp' });
  const token = issueToken(adminId);
  setSessionCookie(res, token);
  res.sendStatus(204);
});

app.get('/admin/session/verify', (req, res) => {
  const t = req.cookies?.adminSession;
  if (!t || !validateToken(t)) return res.status(401).json({ ok: false });
  res.json({ ok: true });
});

app.post('/admin/logout', (req, res) => {
  const t = req.cookies?.adminSession;
  if (t) revokeToken(t);
  res.clearCookie('adminSession', { path: '/' });
  res.sendStatus(204);
});

// Routes
app.use('/', require('./routes')(state));

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
io.use((socket, next) => {
  const isAdmin = socket.handshake?.auth?.isAdmin === true || socket.handshake?.query?.role === 'admin';
  if (!isAdmin) return next();
  try {
    const raw = socket.request.headers.cookie || '';
    const token = (raw.match(/(?:^|; )adminSession=([^;]+)/)||[])[1];
    if (!token || !validateToken(decodeURIComponent(token))) {
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
  console.log(`\n🚨 ${signal} received, starting graceful shutdown...`);
  
  clearInterval(otpCleanupInterval);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  io.emit('server:shutdown', { message: 'Server restarting' });
  io.close(() => {
    console.log('✅ Socket.IO closed');
  });
  
  if (state.adminSocket) state.adminSocket.disconnect();
  state.customerSockets.forEach(socket => socket.disconnect());
  
  setTimeout(() => {
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👤 Customer: ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}`);
  console.log(`👨💼 Admin: ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}/admin`);
  console.log(`❤️ Health: ${process.env.PUBLIC_URL || `http://localhost:${PORT}`}/health`);
  
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const pingUrl = process.env.RENDER_EXTERNAL_URL;
    const pingInterval = parseInt(process.env.PING_INTERVAL) || 240000;
    console.log(`🏓 Render Keep-Alive aktif: ${pingUrl}`);
    console.log(`⏰ Ping interval: ${pingInterval/1000}s`);
    
    const keepAliveInterval = setInterval(async () => {
      try {
        const https = require('https');
        https.get(`${pingUrl}/health`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              console.log(`🏓 Ping OK - Uptime: ${Math.floor(json.uptime)}s`);
            } catch (e) {
              console.log('🏓 Ping OK');
            }
          });
        }).on('error', (error) => {
          console.error('❌ Ping error:', error.message);
        });
      } catch (error) {
        console.error('❌ Ping error:', error.message);
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
