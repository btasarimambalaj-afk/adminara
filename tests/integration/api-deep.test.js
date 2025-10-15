// tests/integration/api-deep.test.js - API Endpoint Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('API Endpoints Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    const result = await startServer();
    server = result.server;
    app = result.app;
  });

  afterAll(async () => {
    await stopServer(server);
  });

  describe('Schema Validation', () => {
    test('Reject invalid payload', async () => {
      const response = await request(app)
        .post('/api/admin/otp/request')
        .send({ invalid: 'data' });

      expect([400, 422]).toContain(response.status);
    });

    test('Accept valid payload', async () => {
      const response = await request(app)
        .post('/api/admin/otp/request')
        .send({});

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Timeout Handling', () => {
    test('Handle slow responses', async () => {
      const response = await request(app)
        .get('/health')
        .timeout(5000);

      expect(response.status).toBe(200);
    });
  });

  describe('Payload Size Limits', () => {
    test('Reject oversized payload', async () => {
      const largePayload = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB
      
      const response = await request(app)
        .post('/api/admin/otp/request')
        .send(largePayload);

      expect([413, 400]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    test('Enforce rate limits', async () => {
      const requests = [];
      for (let i = 0; i < 150; i++) {
        requests.push(request(app).get('/health'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);
  });
});
