const { test, expect } = require('@playwright/test');

test.describe('Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.uptime).toBeGreaterThan(0);
  });

  test('should have correct CORS headers', async ({ request }) => {
    const response = await request.get('/health');

    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
  });
});
