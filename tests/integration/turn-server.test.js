const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

const app = express();

// Mock TURN config endpoint
app.get('/config/ice-servers', (req, res) => {
  const TURN_SERVER_URL = process.env.TURN_SERVER_URL || 'turn:turn.example.com:3478';
  const TURN_SECRET = process.env.TURN_SECRET || 'test-secret';
  const ttl = 300;

  const username = `${Math.floor(Date.now() / 1000) + ttl}:admin`;
  const hmac = crypto.createHmac('sha1', TURN_SECRET);
  hmac.update(username);
  const credential = hmac.digest('base64');

  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: TURN_SERVER_URL, username, credential },
    ],
  });
});

describe('TURN Server Integration', () => {
  test('should return ICE servers config', async () => {
    const res = await request(app).get('/config/ice-servers');

    expect(res.status).toBe(200);
    expect(res.body.iceServers).toBeDefined();
    expect(res.body.iceServers.length).toBeGreaterThanOrEqual(2);
  });

  test('should include STUN server', async () => {
    const res = await request(app).get('/config/ice-servers');

    const stunServer = res.body.iceServers.find(s => s.urls.includes('stun:'));

    expect(stunServer).toBeDefined();
  });

  test('should include TURN server with credentials', async () => {
    const res = await request(app).get('/config/ice-servers');

    const turnServer = res.body.iceServers.find(s => s.urls.includes('turn:'));

    expect(turnServer).toBeDefined();
    expect(turnServer.username).toBeDefined();
    expect(turnServer.credential).toBeDefined();
  });

  test('should generate time-limited credentials', async () => {
    const res = await request(app).get('/config/ice-servers');

    const turnServer = res.body.iceServers.find(s => s.urls.includes('turn:'));

    const [timestamp] = turnServer.username.split(':');
    const expiresAt = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);

    expect(expiresAt).toBeGreaterThan(now);
    expect(expiresAt - now).toBeLessThanOrEqual(300); // 5 minutes
  });

  test('should generate valid HMAC signature', async () => {
    const TURN_SECRET = process.env.TURN_SECRET || 'test-secret';
    const res = await request(app).get('/config/ice-servers');

    const turnServer = res.body.iceServers.find(s => s.urls.includes('turn:'));

    const hmac = crypto.createHmac('sha1', TURN_SECRET);
    hmac.update(turnServer.username);
    const expectedCredential = hmac.digest('base64');

    expect(turnServer.credential).toBe(expectedCredential);
  });
});
