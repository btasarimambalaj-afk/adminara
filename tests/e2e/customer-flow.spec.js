const { test, expect } = require('@playwright/test');

test.describe('Customer Flow', () => {
  test('should load customer page and connect', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('#status')).toContainText('Bağlanıyor', { timeout: 5000 });
    await expect(page.locator('#status')).toContainText('Bağlandı', { timeout: 10000 });
    
    const localVideo = page.locator('#localVideo');
    await expect(localVideo).toBeVisible();
  });

  test('should show waiting message when no admin', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('#status')).toContainText('Bağlandı', { timeout: 10000 });
    
    const statusText = await page.locator('#status').textContent();
    expect(statusText).toContain('destek ekibi');
  });

  test('should toggle camera', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('#status')).toContainText('Bağlandı', { timeout: 10000 });
    
    const toggleBtn = page.locator('#toggleCamera');
    await expect(toggleBtn).toBeVisible();
    
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Kamerayı Aç');
    
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Kamerayı Kapat');
  });

  test('should toggle microphone', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('#status')).toContainText('Bağlandı', { timeout: 10000 });
    
    const toggleBtn = page.locator('#toggleMic');
    await expect(toggleBtn).toBeVisible();
    
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Mikrofonu Aç');
    
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Mikrofonu Kapat');
  });
});
