const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const socketConnections = new client.Gauge({
  name: 'socket_connections_total',
  help: 'Total number of socket connections',
});

const channelStatus = new client.Gauge({
  name: 'channel_status',
  help: 'Channel status (0=UNAVAILABLE, 1=AVAILABLE, 2=BUSY)',
  labelNames: ['status'],
});

const callDuration = new client.Histogram({
  name: 'call_duration_seconds',
  help: 'Duration of calls in seconds',
  buckets: [30, 60, 120, 300, 600, 1800],
});

const errorRate = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'endpoint'],
});

const otpRequests = new client.Counter({
  name: 'otp_requests_total',
  help: 'Total number of OTP requests',
  labelNames: ['status'],
});

const webrtcEvents = new client.Counter({
  name: 'webrtc_events_total',
  help: 'Total number of WebRTC events',
  labelNames: ['event_type'],
});

// OTP Security Metrics
const otpInvalidAttempts = new client.Counter({
  name: 'otp_invalid_attempts_total',
  help: 'Total number of invalid OTP attempts',
});

const otpLockouts = new client.Counter({
  name: 'otp_lockouts_total',
  help: 'Total number of OTP lockouts',
  labelNames: ['reason'],
});

const otpActiveLocks = new client.Gauge({
  name: 'otp_active_locks_gauge',
  help: 'Number of active OTP locks',
});

// WebRTC Reconnect Metrics
const webrtcReconnectAttempts = new client.Counter({
  name: 'webrtc_reconnect_attempts_total',
  help: 'Total WebRTC reconnection attempts',
});

const webrtcReconnectSuccess = new client.Counter({
  name: 'webrtc_reconnect_success_total',
  help: 'Successful WebRTC reconnections',
});

const webrtcReconnectFailures = new client.Counter({
  name: 'webrtc_reconnect_failures_total',
  help: 'Failed WebRTC reconnections',
});

const webrtcReconnectDuration = new client.Histogram({
  name: 'webrtc_reconnect_duration_ms',
  help: 'WebRTC reconnect duration (ms)',
  buckets: [1000, 2000, 5000, 8000, 15000, 30000],
});

const turnSelected = new client.Counter({
  name: 'webrtc_turn_selected_total',
  help: 'Connections that selected TURN relay candidates',
});

const candidateByType = new client.Counter({
  name: 'webrtc_selected_candidate_type_total',
  help: 'Selected candidate type counts (host/srflx/relay)',
  labelNames: ['type'],
});

// Business metrics
const customerSatisfaction = new client.Gauge({
  name: 'customer_satisfaction_rating',
  help: 'Customer satisfaction rating (1-5)',
  labelNames: ['rating'],
});

const queueWaitTime = new client.Histogram({
  name: 'queue_wait_time_seconds',
  help: 'Queue wait time in seconds',
  buckets: [5, 10, 30, 60, 120, 300, 600],
});

const adminResponseTime = new client.Histogram({
  name: 'admin_response_time_seconds',
  help: 'Admin response time in seconds',
  buckets: [1, 5, 10, 30, 60, 120],
});

const callSuccessRate = new client.Counter({
  name: 'call_success_total',
  help: 'Call success/failure count',
  labelNames: ['status'],
});

// Error tracking
const errorsByType = new client.Counter({
  name: 'errors_by_type_total',
  help: 'Errors by type',
  labelNames: ['type', 'severity'],
});

const errorsByEndpoint = new client.Counter({
  name: 'errors_by_endpoint_total',
  help: 'Errors by endpoint',
  labelNames: ['method', 'status'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(socketConnections);
register.registerMetric(channelStatus);
register.registerMetric(callDuration);
register.registerMetric(otpRequests);
register.registerMetric(webrtcEvents);
register.registerMetric(errorRate);
register.registerMetric(otpInvalidAttempts);
register.registerMetric(otpLockouts);
register.registerMetric(otpActiveLocks);
register.registerMetric(webrtcReconnectAttempts);
register.registerMetric(webrtcReconnectSuccess);
register.registerMetric(webrtcReconnectFailures);
register.registerMetric(webrtcReconnectDuration);
register.registerMetric(turnSelected);
register.registerMetric(candidateByType);
register.registerMetric(customerSatisfaction);
register.registerMetric(queueWaitTime);
register.registerMetric(adminResponseTime);
register.registerMetric(callSuccessRate);
register.registerMetric(errorsByType);
register.registerMetric(errorsByEndpoint);

module.exports = {
  register,
  httpRequestDuration,
  socketConnections,
  channelStatus,
  callDuration,
  otpRequests,
  webrtcEvents,
  errorRate,
  otpInvalidAttempts,
  otpLockouts,
  otpActiveLocks,
  webrtcReconnectAttempts,
  webrtcReconnectSuccess,
  webrtcReconnectFailures,
  webrtcReconnectDuration,
  turnSelected,
  candidateByType,
  customerSatisfaction,
  queueWaitTime,
  adminResponseTime,
  callSuccessRate,
  errorsByType,
  errorsByEndpoint,
};
