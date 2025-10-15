// tests/integration/schema-validation-deep.test.js - Schema Validation Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('Schema Validation Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    ({ server, app } = await startServer());
  });

  afterAll(async () => {
    await stopServer();
  });

  test('Valid payload passes validation', async () => {
    const response = await request(app)
      .post('/api/otp/request')
      .send({ phone: '+905551234567' });
    
    expect([200, 201]).toContain(response.status);
  });

  test('Invalid phone format rejected', async () => {
    const response = await request(app)
      .post('/api/otp/request')
      .send({ phone: 'invalid' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('Missing required field rejected', async () => {
    const response = await request(app)
      .post('/api/otp/request')
      .send({});
    
    expect(response.status).toBe(400);
  });

  test('Extra fields ignored or rejected', async () => {
    const response = await request(app)
      .post('/api/otp/request')
      .send({ phone: '+905551234567', extra: 'field' });
    
    expect([200, 201, 400]).toContain(response.status);
  });

  test('SQL injection in params blocked', async () => {
    const response = await request(app)
      .get('/api/user/1 OR 1=1');
    
    expect(response.status).toBe(400);
  });

  test('XSS in body sanitized', async () => {
    const response = await request(app)
      .post('/api/chat/message')
      .send({ message: '<script>alert("xss")</script>' });
    
    if (response.status === 200) {
      expect(response.body.message).not.toContain('<script>');
    }
  });
});
