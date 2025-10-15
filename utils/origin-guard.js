// Origin guard for CORS and metrics
function buildOriginSet(envVar, defaults = []) {
  return (process.env[envVar] || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .concat(defaults);
}

const corsWhitelist = buildOriginSet('ALLOWED_ORIGINS', [
  process.env.PUBLIC_URL,
  'https://adminara.onrender.com',
  'http://localhost:3000',
]);

const metricsWhitelist = buildOriginSet('ALLOWED_METRICS_ORIGINS', [
  process.env.PUBLIC_URL,
  'https://adminara.onrender.com',
  'http://localhost:3000',
]);

function isAllowed(origin, whitelist) {
  if (!origin) return true;
  return whitelist.some(allowed => origin.startsWith(allowed));
}

module.exports = {
  corsWhitelist,
  metricsWhitelist,
  isAllowed,
};
