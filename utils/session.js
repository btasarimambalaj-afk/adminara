const crypto = require('crypto');
const cookie = require('cookie');

const SESS_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const store = new Map();

function issueToken(adminId, ttlMs = SESS_TTL_MS) {
  const token = crypto.randomBytes(32).toString('hex');
  store.set(token, { adminId, exp: Date.now() + ttlMs });
  return token;
}

function validateToken(token) {
  const s = store.get(token);
  if (!s) return false;
  if (s.exp < Date.now()) {
    store.delete(token);
    return false;
  }
  return true;
}

function readSession(token) {
  const s = store.get(token);
  return s && s.exp >= Date.now() ? { adminId: s.adminId, exp: s.exp } : null;
}

function revokeToken(token) {
  store.delete(token);
}

// PR-6: Cookie helpers with __Host- prefix support
function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Host-adminSession' : 'adminSession';
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: true, // __Host- requires secure
    sameSite: 'strict',
    maxAge: SESS_TTL_MS,
    path: '/', // required by __Host-
  });
}

function readSessionFromCookie(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const isProd = process.env.NODE_ENV === 'production';
  const primary = isProd ? '__Host-adminSession' : 'adminSession';
  // Backward-compatible read
  return cookies[primary] || cookies.adminSession || cookies['__Host-adminSession'];
}

module.exports = { 
  issueToken, 
  validateToken, 
  readSession, 
  revokeToken, 
  setSessionCookie, 
  readSessionFromCookie, 
  SESS_TTL_MS 
};
