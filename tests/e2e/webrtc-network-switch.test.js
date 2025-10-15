const { test, expect } = require('@playwright/test');

test.describe('WebRTC Network Switch', () => {
  test('should handle network switch (WiFi to 4G)', async ({ page, context }) => {
    const adminPage = await context.newPage();

    await page.goto('http://localhost:3000');
    await adminPage.goto('http://localhost:3000/admin');

    // Setup connection
    await page.fill('input[placeholder*="isim"]', 'Test Customer');
    await page.click('button:has-text("Destek")');
    await page.waitForTimeout(3000);

    // Simulate network change
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
      setTimeout(() => {
        window.dispatchEvent(new Event('online'));
      }, 1000);
    });

    await page.waitForTimeout(3000);

    // Check reconnection
    const connectionState = await page.evaluate(() => {
      return window.webrtcManager?.peerConnection?.connectionState;
    });

    expect(['connected', 'connecting']).toContain(connectionState);

    await adminPage.close();
  });
});
