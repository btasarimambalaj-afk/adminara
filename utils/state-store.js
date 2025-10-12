const { createClient } = require('redis');
const logger = require('./logger');

let client = null;
const NAMESPACE = process.env.REDIS_NAMESPACE || 'support';
const TTL_SECS = parseInt(process.env.STATE_TTL_SECS || '3600', 10);

function key(name) {
  return `${NAMESPACE}:${name}`;
}

async function init() {
  if (!process.env.REDIS_URL) {
    logger.info('Redis not configured - using in-memory state');
    return null;
  }

  try {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => logger.error('Redis error', { err: err.message }));
    await client.connect();
    logger.info('Redis connected', { url: process.env.REDIS_URL });
    return client;
  } catch (err) {
    logger.error('Redis connection failed', { err: err.message });
    return null;
  }
}

async function isHealthy() {
  if (!client || !client.isOpen) return false;
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

// Connection count
async function incrementConnectionCount() {
  if (!client) return null;
  return client.incr(key('connectionCount'));
}

async function decrementConnectionCount() {
  if (!client) return null;
  return client.decr(key('connectionCount'));
}

// Admin socket
async function setAdminSocket(id) {
  if (!client) return;
  await client.set(key('adminSocket'), id, { EX: TTL_SECS });
}

async function getAdminSocket() {
  if (!client) return null;
  return client.get(key('adminSocket'));
}

async function removeAdminSocket() {
  if (!client) return;
  await client.del(key('adminSocket'));
}

// Customer sockets
async function addCustomerSocket(id, payload) {
  if (!client) return;
  await client.hSet(key('customerSockets'), id, JSON.stringify(payload));
}

async function removeCustomerSocket(id) {
  if (!client) return;
  await client.hDel(key('customerSockets'), id);
}

async function listCustomerSockets() {
  if (!client) return [];
  const data = await client.hGetAll(key('customerSockets'));
  return Object.entries(data).map(([id, json]) => ({ id, ...JSON.parse(json) }));
}

async function activeCustomerCount() {
  if (!client) return 0;
  return client.hLen(key('customerSockets'));
}

// Queue
async function enqueueCustomer(socketId, payload) {
  if (!client) return;
  await client.rPush(key('queue'), JSON.stringify({ socketId, ...payload }));
}

async function dequeueCustomer() {
  if (!client) return null;
  const item = await client.lPop(key('queue'));
  return item ? JSON.parse(item) : null;
}

async function queueLength() {
  if (!client) return 0;
  return client.lLen(key('queue'));
}

// OTP
async function storeOtp(adminId, otp, ttlMs) {
  if (!client) return;
  await client.set(key(`otp:${adminId}`), otp, { PX: ttlMs });
}

async function consumeOtp(adminId) {
  if (!client) return null;
  return client.getDel(key(`otp:${adminId}`));
}

// Session
async function storeSession(token, adminId, ttlMs) {
  if (!client) return;
  await client.set(key(`session:${token}`), adminId, { PX: ttlMs });
}

async function readSession(token) {
  if (!client) return null;
  const adminId = await client.get(key(`session:${token}`));
  if (!adminId) return null;
  await client.pExpire(key(`session:${token}`), TTL_SECS * 1000);
  return { adminId };
}

async function deleteSession(token) {
  if (!client) return;
  await client.del(key(`session:${token}`));
}

// Rate limiter
async function incrWithExpiry(keyName, windowMs) {
  if (!client) return 1;
  const fullKey = key(keyName);
  const value = await client.incr(fullKey);
  if (value === 1) {
    await client.pExpire(fullKey, windowMs);
  }
  return value;
}

async function setWithExpiry(keyName, value, ttlMs) {
  if (!client) return;
  await client.set(key(keyName), value, { PX: ttlMs });
}

async function ttl(keyName) {
  if (!client) return -1;
  return client.pTTL(key(keyName));
}

async function get(keyName) {
  if (!client) return null;
  return client.get(key(keyName));
}

async function del(keyName) {
  if (!client) return;
  await client.del(key(keyName));
}

module.exports = {
  init,
  isHealthy,
  incrementConnectionCount,
  decrementConnectionCount,
  setAdminSocket,
  getAdminSocket,
  removeAdminSocket,
  addCustomerSocket,
  removeCustomerSocket,
  listCustomerSockets,
  activeCustomerCount,
  enqueueCustomer,
  dequeueCustomer,
  queueLength,
  storeOtp,
  consumeOtp,
  storeSession,
  readSession,
  deleteSession,
  incrWithExpiry,
  setWithExpiry,
  ttl,
  get,
  del,
};
