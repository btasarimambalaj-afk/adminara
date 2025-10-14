const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

// Mock database query endpoint
app.get('/user/:id', (req, res) => {
  const { id } = req.params;
  // Vulnerable: Direct SQL injection
  const query = `SELECT * FROM users WHERE id = ${id}`;
  res.json({ query });
});

describe('Security: SQL Injection', () => {
  test('should reject SQL injection in params', async () => {
    const sqlPayload = "1 OR 1=1";
    const res = await request(app).get(`/user/${sqlPayload}`);
    
    expect(res.body.query).not.toContain('OR 1=1');
  });
  
  test('should reject UNION attacks', async () => {
    const sqlPayload = "1 UNION SELECT * FROM admin";
    const res = await request(app).get(`/user/${encodeURIComponent(sqlPayload)}`);
    
    expect(res.body.query).not.toContain('UNION');
  });
  
  test('should reject comment injection', async () => {
    const sqlPayload = "1; DROP TABLE users--";
    const res = await request(app).get(`/user/${encodeURIComponent(sqlPayload)}`);
    
    expect(res.body.query).not.toContain('DROP TABLE');
  });
});
