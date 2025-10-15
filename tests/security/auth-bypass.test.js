const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const app = express();
app.use(express.json());

const { authMiddleware } = require('../../routes/middleware/auth');
const { requireRole } = require('../../routes/middleware/rbac');

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/admin-only', authMiddleware, requireRole('queue:pop'), (req, res) => {
  res.json({ success: true });
});

describe('Security: Auth Bypass', () => {
  test('should reject request without token', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  test('should reject expired token', async () => {
    const expiredToken = jwt.sign(
      { sub: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 },
      config.JWT_SECRET
    );

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('expired');
  });

  test('should reject invalid signature', async () => {
    const invalidToken = jwt.sign({ sub: 'admin' }, 'wrong-secret');

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${invalidToken}`);

    expect(res.status).toBe(401);
  });

  test('should reject insufficient permissions', async () => {
    const viewerToken = jwt.sign({ sub: 'viewer', role: 'viewer', jti: 'test' }, config.JWT_SECRET);

    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('RBAC_403');
  });
});
