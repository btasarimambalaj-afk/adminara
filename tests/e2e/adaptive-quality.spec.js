const { test, expect } = require('@playwright/test');

test.describe('Adaptive Quality', () => {
  test('should load adaptive quality module', async ({ page }) => {
    await page.goto('/');

    // Check if AdaptiveQuality is loaded
    const hasAdaptiveQuality = await page.evaluate(() => {
      return typeof window.AdaptiveQuality !== 'undefined';
    });

    expect(hasAdaptiveQuality).toBe(true);
  });

  test('should create adaptive quality instance', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      // Mock peer connection
      const mockPc = {
        getSenders: () => [],
        connectionState: 'new',
      };

      const aq = new window.AdaptiveQuality(mockPc);
      return {
        minBitrate: aq.minBitrate,
        maxBitrate: aq.maxBitrate,
        currentBitrate: aq.currentBitrate,
      };
    });

    expect(result.minBitrate).toBe(300000);
    expect(result.maxBitrate).toBe(1500000);
    expect(result.currentBitrate).toBe(1500000);
  });

  test('should adjust bitrate based on battery', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const mockPc = {
        getSenders: () => [
          {
            track: { kind: 'video' },
            getParameters: () => ({ encodings: [{}] }),
            setParameters: async params => {
              return params.encodings[0].maxBitrate;
            },
          },
        ],
        connectionState: 'connected',
      };

      const aq = new window.AdaptiveQuality(mockPc);
      aq.batteryLevel = 0.15;
      aq.isLowPower = true;

      await aq.setBitrate(300000);

      return aq.currentBitrate;
    });

    expect(result).toBe(300000);
  });
});
