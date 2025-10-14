import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health status 200': (r) => r.status === 200,
    'health has uptime': (r) => JSON.parse(r.body).uptime > 0,
  });
  
  sleep(1);
  
  // ICE config
  res = http.get(`${BASE_URL}/config/ice-servers`);
  check(res, {
    'ice config status 200': (r) => r.status === 200,
    'ice has servers': (r) => JSON.parse(r.body).iceServers.length > 0,
  });
  
  sleep(1);
  
  // Admin OTP request
  res = http.post(`${BASE_URL}/admin/otp/request`, JSON.stringify({
    adminId: 'admin'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'otp request status 204': (r) => r.status === 204,
  });
  
  sleep(2);
}
