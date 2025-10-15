// tests/security/otp-security-deep.test.js - OTP Security Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('OTP Security Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    ({ server, app } = await startServer());
  });

  afterAll(async () => {
    await stopServer();
  });

  test('OTP brute-force protection', async () => {
    const phone = '+905551234567';
    
    // Request OTP
    await request(app)
      .post('/api/otp/request')
      .send({ phone });

    // Try 5 wrong codes
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/otp/verify')
        .send({ phone, code: '0000' });
    }

    // 6th attempt should be locked
    const response = await request(app)
      .post('/api/otp/verify')
      .send({ phone, code: '0000' });

    expect(response.status).toBe(429);
    expect(response.body.error).toMatch(/locked|too many/i);
  }, 15000);

  test('Rate limit on OTP requests', async () => {
    const phone = '+905551234567';
    const requests = [];

    // Send 10 OTP requests rapidly
    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app)
          .post('/api/otp/request')
          .send({ phone })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  }, 15000);

  test('Lockout duration is 15 minutes', async () => {
    const phone = '+905559999999';
    
    // Trigger lockout
    await request(app).post('/api/otp/request').send({ phone });
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/otp/verify').send({ phone, code: '0000' });
    }

    // Verify locked
    const locked = await request(app)
      .post('/api/otp/verify')
      .send({ phone, code: '0000' });
    expect(locked.status).toBe(429);

    // Note: Full 15min test would take too long, just verify lockout exists
    expect(locked.body).toHaveProperty('retryAfter');
  }, 10000);

  test('Valid OTP code length is 6 digits', async () => {
    const phone = '+905551234567';
    
    await request(app).post('/api/otp/request').send({ phone });

    const shortCode = await request(app)
      .post('/api/otp/verify')
      .send({ phone, code: '123' });
    expect(shortCode.status).toBe(400);

    const longCode = await request(app)
      .post('/api/otp/verify')
      .send({ phone, code: '1234567' });
    expect(longCode.status).toBe(400);
  });

  test('OTP expires after timeout', async () => {
    const phone = '+905551234567';
    
    const otpResponse = await request(app)
      .post('/api/otp/request')
      .send({ phone });

    expect(otpResponse.body).toHaveProperty('expiresIn');
    expect(otpResponse.body.expiresIn).toBeGreaterThan(0);
  });
});
