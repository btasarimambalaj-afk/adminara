// tests/security/cors-deep.test.js - CORS Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('CORS Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    const result = await startServer();
    server = result.server;
    app = result.app;
  });

  afterAll(async () => {
    await stopServer(server);
  });

  test('Block unauthorized origins', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://evil.com');

    expect([403, 200]).toContain(response.status);
    if (response.status === 200) {
      expect(response.headers['access-control-allow-origin']).not.toBe('https://evil.com');
    }
  });

  test('Allow whitelisted origins', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(200);
  });

  test('Handle preflight requests', async () => {
    const response = await request(app)
      .options('/api/admin/session')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    expect([200, 204]).toContain(response.status);
  });
});
