// tests/security/csp-cors-deep.test.js - CSP & CORS Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('CSP & CORS Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    ({ server, app } = await startServer());
  });

  afterAll(async () => {
    await stopServer();
  });

  describe('CSP Headers', () => {
    test('CSP blocks eval()', async () => {
      const response = await request(app).get('/');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toBeDefined();
      expect(csp).not.toContain("'unsafe-eval'");
    });

    test('CSP blocks inline scripts', async () => {
      const response = await request(app).get('/');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toBeDefined();
      expect(csp).not.toContain("'unsafe-inline'");
    });

    test('CSP allows self scripts', async () => {
      const response = await request(app).get('/');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toContain("'self'");
    });

    test('CSP default-src is restrictive', async () => {
      const response = await request(app).get('/');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toMatch(/default-src[^;]*'self'/);
    });
  });

  describe('CORS Headers', () => {
    test('Preflight OPTIONS request', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'https://adminara.onrender.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('Origin whitelist validation', async () => {
      const validOrigin = await request(app)
        .get('/api/health')
        .set('Origin', 'https://adminara.onrender.com');

      expect(validOrigin.headers['access-control-allow-origin']).toBe('https://adminara.onrender.com');
    });

    test('Invalid origin blocked', async () => {
      const invalidOrigin = await request(app)
        .get('/api/health')
        .set('Origin', 'https://evil.com');

      expect(invalidOrigin.headers['access-control-allow-origin']).not.toBe('https://evil.com');
    });

    test('CORS credentials allowed', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://adminara.onrender.com');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('CORS methods whitelisted', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'https://adminara.onrender.com');

      const methods = response.headers['access-control-allow-methods'];
      expect(methods).toMatch(/GET|POST|PUT|DELETE/);
    });
  });
});
