const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

describe('GET /config - ICE servers', () => {
  let app;

  function createTestApp(turnConfig = {}) {
    const testApp = express();
    testApp.use(express.json());

    const TURN_URL = turnConfig.TURN_URL;
    const TURN_USER = turnConfig.TURN_USER;
    const TURN_PASS = turnConfig.TURN_PASS;
    const TURN_MODE = turnConfig.TURN_MODE || 'static';
    const TURN_SECRET = turnConfig.TURN_SECRET;

    function buildIceServersForClient(adminId = 'admin') {
      const ice = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];
      if (!TURN_URL) return { iceServers: ice };

      if (TURN_MODE === 'rest' && TURN_SECRET) {
        const ttlSecs = 3600;
        const username = `${Math.floor(Date.now() / 1000) + ttlSecs}:${adminId}`;
        const hmac = crypto.createHmac('sha1', TURN_SECRET);
        hmac.update(username);
        const credential = hmac.digest('base64');
        ice.push({ urls: TURN_URL, username, credential });
      } else if (TURN_USER && TURN_PASS) {
        ice.push({ urls: TURN_URL, username: TURN_USER, credential: TURN_PASS });
      }
      return { iceServers: ice };
    }

    testApp.get('/config', (req, res) => {
      const adminId = 'admin';
      res.json(buildIceServersForClient(adminId));
    });

    return testApp;
  }

  it('returns STUN only when no TURN env', async () => {
    app = createTestApp({});
    const res = await request(app).get('/config').expect(200);

    expect(res.body.iceServers).toBeDefined();
    expect(res.body.iceServers.length).toBeGreaterThanOrEqual(2);
    expect(res.body.iceServers.find(s => String(s.urls).startsWith('turn:'))).toBeFalsy();
  });

  it('returns TURN with static credentials', async () => {
    app = createTestApp({
      TURN_URL: 'turn:1.2.3.4:3478',
      TURN_MODE: 'static',
      TURN_USER: 'adminara',
      TURN_PASS: 'testpass',
    });
    const res = await request(app).get('/config').expect(200);

    const turn = res.body.iceServers.find(s => String(s.urls).startsWith('turn:'));
    expect(turn).toBeDefined();
    expect(turn.username).toBe('adminara');
    expect(turn.credential).toBe('testpass');
  });

  it('returns REST mode ephemeral credentials', async () => {
    app = createTestApp({
      TURN_URL: 'turn:1.2.3.4:3478',
      TURN_MODE: 'rest',
      TURN_SECRET: 'secret123',
    });
    const res = await request(app).get('/config').expect(200);

    const turn = res.body.iceServers.find(s => String(s.urls).startsWith('turn:'));
    expect(turn).toBeDefined();
    expect(turn.username).toMatch(/^\d+:admin$/);
    expect(typeof turn.credential).toBe('string');
    expect(turn.credential.length).toBeGreaterThan(0);
  });

  it('ignores TURN if URL missing', async () => {
    app = createTestApp({
      TURN_MODE: 'static',
      TURN_USER: 'adminara',
      TURN_PASS: 'testpass',
    });
    const res = await request(app).get('/config').expect(200);

    expect(res.body.iceServers.find(s => String(s.urls).startsWith('turn:'))).toBeFalsy();
  });
});
