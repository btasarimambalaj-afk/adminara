const crypto = require('crypto');
const config = require('../config');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Derive encryption key from password
 * @param {string} password - Password/secret
 * @param {Buffer} salt - Salt
 * @returns {Buffer} Derived key
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt data (AES-256-GCM)
 * @param {string} plaintext - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {string} Encrypted data (base64)
 */
function encrypt(plaintext, password = config.ENCRYPTION_KEY) {
  if (!password) {
    logger.warn('No encryption key configured');
    return plaintext;
  }

  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    // Format: salt:iv:tag:encrypted
    return [salt.toString('base64'), iv.toString('base64'), tag.toString('base64'), encrypted].join(
      ':'
    );
  } catch (err) {
    logger.error('Encryption failed', { error: err.message });
    throw err;
  }
}

/**
 * Decrypt data (AES-256-GCM)
 * @param {string} ciphertext - Encrypted data (base64)
 * @param {string} password - Decryption password
 * @returns {string} Decrypted data
 */
function decrypt(ciphertext, password = config.ENCRYPTION_KEY) {
  if (!password) {
    logger.warn('No encryption key configured');
    return ciphertext;
  }

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid ciphertext format');
    }

    const salt = Buffer.from(parts[0], 'base64');
    const iv = Buffer.from(parts[1], 'base64');
    const tag = Buffer.from(parts[2], 'base64');
    const encrypted = parts[3];

    const key = deriveKey(password, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    logger.error('Decryption failed', { error: err.message });
    throw err;
  }
}

/**
 * Mask PII data
 * @param {string} data - Data to mask
 * @param {string} type - Data type (email, phone, name)
 * @returns {string} Masked data
 */
function maskPii(data, type = 'auto') {
  if (!data) return data;

  if (type === 'email' || (type === 'auto' && data.includes('@'))) {
    // email@example.com → e***l@example.com
    const [local, domain] = data.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  if (type === 'phone' || (type === 'auto' && /^\+?\d+$/.test(data))) {
    // +905551234567 → +90555***4567
    if (data.length <= 6) return '***';
    return `${data.substring(0, data.length - 4)}${'*'.repeat(Math.min(data.length - 6, 3))}${data.substring(data.length - 4)}`;
  }

  if (type === 'name') {
    // John Doe → J*** D***
    return data
      .split(' ')
      .map(word => (word.length <= 1 ? word : `${word[0]}${'*'.repeat(word.length - 1)}`))
      .join(' ');
  }

  // Default: mask middle
  if (data.length <= 4) return '***';
  return `${data.substring(0, 2)}${'*'.repeat(data.length - 4)}${data.substring(data.length - 2)}`;
}

/**
 * Hash data (SHA-256)
 * @param {string} data - Data to hash
 * @returns {string} Hash (hex)
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  maskPii,
  hash,
};
