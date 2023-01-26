import { test, expect } from '@playwright/experimental-ct-vue';
import type ChartWidgetTestContext from './ChartWidgetTestContext';

test.use({ viewport: { width: 1024, height: 800 } });

test('one pane, filled before mount, no drawings', async ({ page }) => {
  await page.evaluate(() => {
    // eslint-disable-next-line
    const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
    chart.createPane(newDataSource({ idHelper }, []));

    mount();
  });

  await expect(page).toHaveScreenshot('one pane, no drawings.png');
});

test('one pane, filled after mount, no drawings', async ({ page }) => {
  await page.evaluate(() => {
    // eslint-disable-next-line
    const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
    mount();

    chart.createPane(newDataSource({ idHelper }, []));
  });

  await expect(page).toHaveScreenshot('one pane, no drawings.png');
});
