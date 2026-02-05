import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('demo app', () => {
  test('loads chart widget', async ({ page }) => {
    const app = page.locator('#app');
    await expect(app).toBeVisible();

    const canvasCount = await app.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
  });
});
