const request = require('supertest');
const express = require('express');
const { issueTokens } = require('../../utils/auth');

// Mock app setup
const app = express();
app.use(express.json());

const { correlationMiddleware } = require('../../routes/middleware/correlation');
app.use(correlationMiddleware);

const adminRoutes = require('../../routes/v1/admin');
const customerRoutes = require('../../routes/v1/customer');

app.use('/v1/admin', adminRoutes);
app.use('/v1/customer', customerRoutes);

// Mock state
app.set('state', {
  customerSockets: new Map(),
  channelStatus: 'AVAILABLE',
});

describe('V1 API Routes', () => {
  describe('Customer Routes', () => {
    test('POST /v1/customer/join-queue should return position', async () => {
      const res = await request(app)
        .post('/v1/customer/join-queue')
        .send({ name: 'Test Customer' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('position');
      expect(res.body).toHaveProperty('estimatedWait');
    });

    test('POST /v1/customer/join-queue should validate name', async () => {
      const res = await request(app).post('/v1/customer/join-queue').send({ name: 'A' }); // Too short

      expect(res.status).toBe(400);
    });

    test('GET /v1/customer/queue-status should return status', async () => {
      const res = await request(app).get('/v1/customer/queue-status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('queueLength');
      expect(res.body).toHaveProperty('channelStatus');
    });
  });

  describe('Admin Routes', () => {
    let adminToken;

    beforeAll(() => {
      const { accessToken } = issueTokens({ id: 'admin', role: 'admin' });
      adminToken = accessToken;
    });

    test('GET /v1/admin/queue should require auth', async () => {
      const res = await request(app).get('/v1/admin/queue');

      expect(res.status).toBe(401);
    });

    test('GET /v1/admin/queue should return queue with valid token', async () => {
      const res = await request(app)
        .get('/v1/admin/queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('queue');
      expect(res.body).toHaveProperty('count');
    });

    test('POST /v1/admin/queue/pop should require queue:pop permission', async () => {
      const { accessToken } = issueTokens({ id: 'viewer', role: 'viewer' });

      const res = await request(app)
        .post('/v1/admin/queue/pop')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Correlation ID', () => {
    test('should add X-Request-ID to response', async () => {
      const res = await request(app).get('/v1/customer/queue-status');

      expect(res.headers['x-request-id']).toBeDefined();
    });

    test('should use provided X-Request-ID', async () => {
      const requestId = 'test-request-id';
      const res = await request(app)
        .get('/v1/customer/queue-status')
        .set('X-Request-ID', requestId);

      expect(res.headers['x-request-id']).toBe(requestId);
    });
  });
});
