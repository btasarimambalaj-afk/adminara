const crypto = require('crypto');

/**
 * Generate ephemeral TURN credentials (RFC 5389)
 * @param {string} secret - Shared secret with TURN server
 * @param {number} ttl - Time to live in seconds (default: 24 hours)
 * @returns {Object} - { username, credential, expiresAt }
 */
function generateTurnCredentials(secret, ttl = 300) {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const username = `${timestamp}:hayday`;
  // CodeQL: sha1 is required by RFC 5389 for TURN credentials
  // This is not used for password hashing or security-critical operations
  // lgtm[js/weak-cryptographic-algorithm]
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(username);
  const credential = hmac.digest('base64');

  return {
    username,
    credential,
    expiresAt: timestamp,
    ttl,
  };
}

// Cache for TURN credentials
let cachedCredentials = null;
let cacheExpiry = 0;

/**
 * Get ICE servers configuration with ephemeral TURN credentials
 * @returns {Array} - ICE servers array
 */
async function getICEServers() {
  const now = Date.now();

  // Return cached credentials if still valid (with 30s buffer)
  if (cachedCredentials && cacheExpiry > now + 30000) {
    return cachedCredentials;
  }

  let iceServers = [];

  try {
    // Parse custom ICE_SERVERS if provided
    if (process.env.ICE_SERVERS) {
      iceServers = JSON.parse(process.env.ICE_SERVERS);
      cachedCredentials = iceServers;
      cacheExpiry = now + 3600000; // 1 hour
      return iceServers;
    }

    // Default STUN servers
    iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ];

    // Add TURN with ephemeral credentials if configured
    if (process.env.TURN_SERVER_URL && process.env.TURN_SECRET) {
      const ttl = parseInt(process.env.TURN_TTL || '300');
      const { username, credential } = generateTurnCredentials(process.env.TURN_SECRET, ttl);

      iceServers.push({
        urls: process.env.TURN_SERVER_URL,
        username,
        credential,
      });

      // Add TURNS (TLS) if available
      if (process.env.TURNS_SERVER_URL) {
        iceServers.push({
          urls: process.env.TURNS_SERVER_URL,
          username,
          credential,
        });
      }
    }
    // Fallback to static TURN credentials
    else if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME) {
      iceServers.push({
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD || 'pass',
      });
    }

    // Add Twilio TURN if configured
    if (process.env.TWILIO_TURN_URL) {
      iceServers.push({
        urls: process.env.TWILIO_TURN_URL,
        username: process.env.TWILIO_TURN_USERNAME,
        credential: process.env.TWILIO_TURN_CREDENTIAL,
      });
    }

    // Add Metered TURN if configured
    if (process.env.METERED_TURN_URL) {
      iceServers.push({
        urls: process.env.METERED_TURN_URL,
        username: process.env.METERED_TURN_USERNAME,
        credential: process.env.METERED_TURN_CREDENTIAL,
      });
    }
  } catch (error) {
    console.error('ICE servers configuration error:', error.message);
    // Fallback to basic STUN
    iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  }

  // Force TURN-only mode if configured
  if (process.env.FORCE_TURN === 'true') {
    iceServers = iceServers.filter(
      server => server.urls.includes('turn:') || server.urls.includes('turns:')
    );
  }

  // Cache the result
  if (process.env.TURN_SECRET) {
    const ttl = parseInt(process.env.TURN_TTL || '86400');
    cacheExpiry = now + ttl * 1000;
  } else {
    cacheExpiry = now + 3600000; // 1 hour for static credentials
  }
  cachedCredentials = iceServers;

  return iceServers;
}

module.exports = {
  generateTurnCredentials,
  getICEServers,
};
