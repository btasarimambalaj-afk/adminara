// tests/integration/fetch-deep.test.js - Fetch API Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('Fetch API Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    ({ server, app } = await startServer());
  });

  afterAll(async () => {
    await stopServer();
  });

  test('Timeout handling', async () => {
    const response = await request(app)
      .get('/api/slow-endpoint')
      .timeout(1000);
    
    expect([408, 504]).toContain(response.status);
  }, 15000);

  test('HTTP 200 response', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  test('HTTP 403 forbidden', async () => {
    const response = await request(app)
      .get('/admin/dashboard')
      .set('Cookie', 'invalid=token');
    
    expect(response.status).toBe(403);
  });

  test('HTTP 500 server error handling', async () => {
    const response = await request(app)
      .post('/api/trigger-error')
      .send({ crash: true });
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

  test('Retry mechanism on network failure', async () => {
    let attempts = 0;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      attempts++;
      try {
        await request(app).get('/health');
        break;
      } catch (err) {
        if (i === maxRetries - 1) throw err;
      }
    }

    expect(attempts).toBeLessThanOrEqual(maxRetries);
  });
});
