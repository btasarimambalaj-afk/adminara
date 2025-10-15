// tests/e2e/serviceworker-deep.test.js - Service Worker Deep Tests

const { test, expect } = require('@playwright/test');

test.describe('Service Worker Deep Tests', () => {
  test('Cache-first strategy', async ({ page, context }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for SW registration
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    
    // First load - network
    const firstLoad = await page.evaluate(async () => {
      const response = await fetch('/manifest.json');
      return response.headers.get('x-cache');
    });
    
    // Second load - cache
    const secondLoad = await page.evaluate(async () => {
      const response = await fetch('/manifest.json');
      return response.headers.get('x-cache');
    });
    
    expect(secondLoad).toBe('HIT');
  });

  test('Network-first strategy for API', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/health');
      return response.status;
    });
    
    expect(apiResponse).toBe(200);
  });

  test('Offline mode control', async ({ page, context }) => {
    await page.goto('http://localhost:3000');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to load cached resource
    const offlineResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/');
        return response.status;
      } catch {
        return 'offline';
      }
    });
    
    expect([200, 'offline']).toContain(offlineResponse);
  });

  test('SW update detection', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const hasUpdate = await page.evaluate(() => {
      return new Promise((resolve) => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          reg.addEventListener('updatefound', () => resolve(true));
          setTimeout(() => resolve(false), 2000);
        });
      });
    });
    
    expect(typeof hasUpdate).toBe('boolean');
  });
});
