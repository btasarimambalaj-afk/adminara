const request = require('supertest');
const express = require('express');
const metrics = require('../../utils/metrics');

describe('Reconnect Metrics Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post('/metrics/reconnect-attempt', (req, res) => {
      metrics.webrtcReconnectAttempts.inc();
      res.sendStatus(204);
    });

    app.post('/metrics/reconnect-success', (req, res) => {
      metrics.webrtcReconnectSuccess.inc();
      const duration = Number(req.body?.duration);
      if (!Number.isNaN(duration)) {
        metrics.webrtcReconnectDuration.observe(duration);
      }
      res.sendStatus(204);
    });

    app.post('/metrics/reconnect-failure', (req, res) => {
      metrics.webrtcReconnectFailures.inc();
      res.sendStatus(204);
    });

    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', metrics.register.contentType);
      res.end(await metrics.register.metrics());
    });
  });

  it('should increment reconnect attempt counter', async () => {
    await request(app).post('/metrics/reconnect-attempt').expect(204);

    const response = await request(app).get('/metrics');
    expect(response.text).toContain('webrtc_reconnect_attempts_total');
  });

  it('should increment reconnect success counter', async () => {
    await request(app).post('/metrics/reconnect-success').send({ duration: 5000 }).expect(204);

    const response = await request(app).get('/metrics');
    expect(response.text).toContain('webrtc_reconnect_success_total');
  });

  it('should increment reconnect failure counter', async () => {
    await request(app).post('/metrics/reconnect-failure').expect(204);

    const response = await request(app).get('/metrics');
    expect(response.text).toContain('webrtc_reconnect_failures_total');
  });

  it('should observe reconnect duration', async () => {
    await request(app).post('/metrics/reconnect-success').send({ duration: 3000 }).expect(204);

    const response = await request(app).get('/metrics');
    expect(response.text).toContain('webrtc_reconnect_duration_ms');
    expect(response.text).toContain('webrtc_reconnect_duration_ms_bucket');
  });

  it('should handle missing duration gracefully', async () => {
    await request(app).post('/metrics/reconnect-success').send({}).expect(204);

    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
  });
});
