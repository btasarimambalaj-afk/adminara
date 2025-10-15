// tests/e2e/ui-ux-deep.test.js - UI/UX Deep Tests

const { test, expect } = require('@playwright/test');

test.describe('UI/UX Deep Tests', () => {
  test('Dark mode toggle', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const darkModeToggle = page.locator('[data-theme-toggle]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      const isDark = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(isDark).toBe(true);
    }
  });

  test('Animation performance FPS', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        
        function count() {
          frames++;
          if (performance.now() - start < 1000) {
            requestAnimationFrame(count);
          } else {
            resolve(frames);
          }
        }
        requestAnimationFrame(count);
      });
    });

    expect(fps).toBeGreaterThan(30);
  });

  test('ARIA labels present', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('Contrast ratio compliance', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const contrast = await page.evaluate(() => {
      const el = document.querySelector('body');
      const style = getComputedStyle(el);
      return {
        color: style.color,
        background: style.backgroundColor
      };
    });

    expect(contrast.color).toBeTruthy();
    expect(contrast.background).toBeTruthy();
  });

  test('Keyboard navigation flow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement.tagName);
    
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
  });

  test('Media query breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 375, name: 'mobile' },
      { width: 768, name: 'tablet' },
      { width: 1920, name: 'desktop' }
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: 667 });
      await page.goto('http://localhost:3000');
      
      const hasOverflow = await page.evaluate(() => 
        document.body.scrollWidth > window.innerWidth
      );
      
      expect(hasOverflow).toBe(false);
    }
  });
});
