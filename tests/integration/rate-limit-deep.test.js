// tests/integration/rate-limit-deep.test.js - Rate Limiting Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('Rate Limiting Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    ({ server, app } = await startServer());
  });

  afterAll(async () => {
    await stopServer();
  });

  test('Rate limit kicks in after threshold', async () => {
    const requests = [];
    
    for (let i = 0; i < 150; i++) {
      requests.push(request(app).get('/health'));
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  }, 30000);

  test('Rate limit resets after window', async () => {
    await request(app).get('/health');
    
    await new Promise(resolve => setTimeout(resolve, 61000));
    
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  }, 65000);

  test('Different endpoints have separate limits', async () => {
    const healthRequests = [];
    for (let i = 0; i < 50; i++) {
      healthRequests.push(request(app).get('/health'));
    }
    
    await Promise.all(healthRequests);
    
    const otpResponse = await request(app)
      .post('/api/otp/request')
      .send({ phone: '+905551234567' });
    
    expect(otpResponse.status).not.toBe(429);
  });

  test('Admin endpoints have stricter limits', async () => {
    const requests = [];
    
    for (let i = 0; i < 60; i++) {
      requests.push(
        request(app)
          .get('/admin/dashboard')
          .set('Cookie', 'adminSession=test')
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  }, 30000);
});
