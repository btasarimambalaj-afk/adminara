const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

// Mock chat endpoint
app.post('/chat/message', (req, res) => {
  const { message } = req.body;
  // Vulnerable: No sanitization
  res.json({ message });
});

describe('Security: XSS Injection', () => {
  test('should reject script tags', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const res = await request(app)
      .post('/chat/message')
      .send({ message: xssPayload });
    
    expect(res.body.message).not.toContain('<script>');
  });
  
  test('should reject event handlers', async () => {
    const xssPayload = '<img src=x onerror="alert(1)">';
    const res = await request(app)
      .post('/chat/message')
      .send({ message: xssPayload });
    
    expect(res.body.message).not.toContain('onerror');
  });
  
  test('should reject javascript: protocol', async () => {
    const xssPayload = '<a href="javascript:alert(1)">Click</a>';
    const res = await request(app)
      .post('/chat/message')
      .send({ message: xssPayload });
    
    expect(res.body.message).not.toContain('javascript:');
  });
});
