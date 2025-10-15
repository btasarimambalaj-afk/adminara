// tests/e2e/a11y-deep.test.js - Accessibility Deep Tests

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

test.describe('Accessibility Deep Tests', () => {
  test('WCAG 2.1 AA compliance - Customer page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('WCAG 2.1 AA compliance - Admin page', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true
    });
  });

  test('Keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement.tagName);
    expect(['INPUT', 'BUTTON', 'SELECT', 'A']).toContain(firstFocused);
    
    // Verify focus visible
    const hasFocusVisible = await page.evaluate(() => {
      const style = window.getComputedStyle(document.activeElement);
      return style.outline !== 'none' || style.boxShadow !== 'none';
    });
    expect(hasFocusVisible).toBe(true);
  });

  test('Screen reader landmarks', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const landmarks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role], main, nav, header, footer'))
        .map(el => el.tagName + (el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''));
    });
    
    expect(landmarks.length).toBeGreaterThan(0);
  });
});
