const { test, expect } = require('@playwright/test');

test.describe('WebRTC ICE Restart', () => {
  test('should restart ICE on connection failure', async ({ page, context }) => {
    const adminPage = await context.newPage();
    
    await page.goto('http://localhost:3000');
    await adminPage.goto('http://localhost:3000/admin');
    
    // Admin login
    await adminPage.fill('input[type="text"]', 'admin');
    await adminPage.click('button:has-text("OTP Gönder")');
    await adminPage.waitForTimeout(2000);
    
    // Customer join
    await page.fill('input[placeholder*="isim"]', 'Test Customer');
    await page.click('button:has-text("Destek")');
    
    await page.waitForTimeout(3000);
    
    // Simulate network failure
    await page.evaluate(() => {
      if (window.webrtcManager && window.webrtcManager.peerConnection) {
        window.webrtcManager.peerConnection.close();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check ICE restart triggered
    const iceRestarted = await page.evaluate(() => {
      return window.webrtcManager?.reconnectAttempts > 0;
    });
    
    expect(iceRestarted).toBe(true);
    
    await adminPage.close();
  });
});
