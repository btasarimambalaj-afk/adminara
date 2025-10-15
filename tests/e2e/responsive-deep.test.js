// tests/e2e/responsive-deep.test.js - Responsive Design Tests

const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

viewports.forEach(viewport => {
  test.describe(`Responsive: ${viewport.name}`, () => {
    test.use({ viewport });

    test('Layout integrity', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Check no horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
      
      // Check main elements visible
      await expect(page.locator('.hero-wrapper')).toBeVisible();
      await expect(page.locator('#startCallBtn')).toBeVisible();
    });

    test('Button accessibility', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const button = page.locator('#startCallBtn');
      await expect(button).toBeVisible();
      
      // Check touch target size (min 44x44)
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    });
  });
});
