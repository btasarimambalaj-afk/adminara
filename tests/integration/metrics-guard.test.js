const request = require('supertest');
const express = require('express');

describe('Metrics Origin Guard', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const metrics = { webrtcReconnectAttempts: { inc: jest.fn() } };

    function metricsOriginGuard(req, res, next) {
      const origin = String(req.headers.origin || '');
      const allowed = ['http://localhost:3000'];
      if (origin && !allowed.some(a => origin.startsWith(a))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    }

    app.post('/metrics/reconnect-attempt', metricsOriginGuard, (req, res) => {
      metrics.webrtcReconnectAttempts.inc();
      res.sendStatus(204);
    });
  });

  test('blocks foreign origin', async () => {
    await request(app)
      .post('/metrics/reconnect-attempt')
      .set('Origin', 'https://evil.com')
      .expect(403);
  });

  test('allows localhost origin', async () => {
    await request(app)
      .post('/metrics/reconnect-attempt')
      .set('Origin', 'http://localhost:3000')
      .expect(204);
  });

  test('allows no origin (server-side)', async () => {
    await request(app).post('/metrics/reconnect-attempt').expect(204);
  });
});
