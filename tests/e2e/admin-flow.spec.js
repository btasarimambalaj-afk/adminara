const { test, expect } = require('@playwright/test');

test.describe('Admin Flow', () => {
  test('should load admin page', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page.locator('h1')).toContainText('Admin Panel');
    await expect(page.locator('#otpInput')).toBeVisible();
    await expect(page.locator('#loginBtn')).toBeVisible();
  });

  test('should reject invalid OTP', async ({ page }) => {
    await page.goto('/admin');
    
    await page.fill('#otpInput', '000000');
    await page.click('#loginBtn');
    
    await expect(page.locator('#status')).toContainText('Hata', { timeout: 5000 });
  });

  test('should show OTP input on page load', async ({ page }) => {
    await page.goto('/admin');
    
    const otpInput = page.locator('#otpInput');
    await expect(otpInput).toBeVisible();
    await expect(otpInput).toHaveAttribute('maxlength', '6');
    await expect(otpInput).toHaveAttribute('placeholder', '6 haneli OTP');
  });
});
