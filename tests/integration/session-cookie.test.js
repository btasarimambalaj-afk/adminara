const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

describe('httpOnly cookie session', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser('test-secret'));

    const { issueToken, validateToken, revokeToken, SESS_TTL_MS } = require('../../utils/session');
    
    function setSessionCookie(res, token, ttl = SESS_TTL_MS) {
      res.cookie('adminSession', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        maxAge: ttl,
        path: '/'
      });
    }

    app.post('/admin/otp/verify', (req, res) => {
      const token = issueToken('admin');
      setSessionCookie(res, token);
      res.sendStatus(204);
    });

    app.get('/admin/session/verify', (req, res) => {
      const t = req.cookies?.adminSession;
      if (!t || !validateToken(t)) return res.status(401).json({ ok: false });
      res.json({ ok: true });
    });

    app.post('/admin/logout', (req, res) => {
      const t = req.cookies?.adminSession;
      if (t) revokeToken(t);
      res.clearCookie('adminSession', { path: '/' });
      res.sendStatus(204);
    });
  });

  it('OTP verify sets httpOnly+Strict cookie', async () => {
    const res = await request(app)
      .post('/admin/otp/verify')
      .send({ adminId: 'admin', code: '123456' })
      .expect(204);
    
    const setCookie = res.headers['set-cookie'][0];
    expect(setCookie).toMatch(/adminSession=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
  });

  it('session verify requires cookie', async () => {
    await request(app).get('/admin/session/verify').expect(401);
  });

  it('session verify accepts valid cookie', async () => {
    const loginRes = await request(app).post('/admin/otp/verify').send({});
    const cookie = loginRes.headers['set-cookie'][0];
    
    await request(app)
      .get('/admin/session/verify')
      .set('Cookie', cookie)
      .expect(200);
  });

  it('logout clears cookie', async () => {
    const loginRes = await request(app).post('/admin/otp/verify').send({});
    const cookie = loginRes.headers['set-cookie'][0];
    
    const logoutRes = await request(app)
      .post('/admin/logout')
      .set('Cookie', cookie)
      .expect(204);
    
    const cleared = logoutRes.headers['set-cookie'][0];
    expect(cleared).toMatch(/adminSession=;/);
  });
});
