const request = require('supertest');
const express = require('express');
const routes = require('../../routes');

describe('API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    const mockState = {
      adminSocket: null,
      customerSockets: new Map(),
      channelStatus: 'AVAILABLE',
      connectionCount: 0,
      bot: null
    };
    app.use('/', routes(mockState));
  });

  describe('GET /health', () => {
    test('should return 200 and health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('should include system metrics', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('admin');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('channel');
      expect(response.body).toHaveProperty('connections');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('GET /config/ice-servers', () => {
    test('should return ICE servers configuration', async () => {
      const response = await request(app).get('/config/ice-servers');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('iceServers');
      expect(Array.isArray(response.body.iceServers)).toBe(true);
    });

    test('should include STUN server', async () => {
      const response = await request(app).get('/config/ice-servers');
      const stunServer = response.body.iceServers.find(s => 
        s.urls.includes('stun:')
      );
      expect(stunServer).toBeDefined();
    });
  });

  describe('GET /metrics', () => {
    test('should require authentication in production', async () => {
      process.env.NODE_ENV = 'production';
      const response = await request(app).get('/metrics');
      expect(response.status).toBe(401);
      delete process.env.NODE_ENV;
    });

    test('should return metrics without auth in development', async () => {
      const response = await request(app).get('/metrics');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });
});
