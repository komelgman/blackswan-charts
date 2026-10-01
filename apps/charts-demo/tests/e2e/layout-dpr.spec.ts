import { expect, test, type Page } from '@playwright/test';

async function expectPanesInsideChart(page: Page) {
  await expect.poll(() => page.locator('.chart-host').evaluate(host => {
    const bounds = host.getBoundingClientRect();
    const panes = Array.from(host.querySelectorAll('.viewport'), pane => pane.getBoundingClientRect());
    const timeline = host.querySelector('.timeline')!.getBoundingClientRect();
    return {
      count: panes.length,
      contained: panes.every(pane => pane.top >= bounds.top - 1 && pane.bottom <= bounds.bottom + 1),
      minimumSize: panes.every(pane => pane.height >= 99),
      timelineInside: timeline.bottom <= bounds.bottom + 1,
      fillsHeight: Math.abs(timeline.bottom - bounds.bottom) < 1,
    };
  })).toEqual({ count: 3, contained: true, minimumSize: true, timelineInside: true, fillsHeight: true });
}

async function paneHeights(page: Page) {
  const heights = await page.locator('.viewport').evaluateAll(panes => panes.map(pane => pane.getBoundingClientRect().height));
  expect(heights).toHaveLength(3);
  return heights as [number, number, number];
}

test.describe('pane layout at high pixel density', () => {
  test.use({ deviceScaleFactor: 2 });

  for (const width of [802, 390]) {
    test(`fits three panes and their timeline before and after resize at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1100 });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('./#/examples/percentage');
      const host = page.locator('.chart-host');
      await host.evaluate((element, viewportWidth) => {
        const chartElement = element as HTMLElement;
        if (viewportWidth === 802) chartElement.style.width = '740px';
        chartElement.style.height = viewportWidth === 802 ? '440px' : '400px';
      }, width);
      await expectPanesInsideChart(page);
      await host.evaluate(element => { (element as HTMLElement).style.height = '520px'; });
      await expectPanesInsideChart(page);

      const before = await paneHeights(page);
      const divider = page.locator('.resize-handle').first();
      const bounds = (await divider.boundingBox())!;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + 24, { steps: 6 });
      await page.mouse.up();
      await expect.poll(async () => Math.abs((await paneHeights(page))[0] - before[0] - 24)).toBeLessThan(1);
      const changed = await paneHeights(page);
      expect(changed[1]).toBeCloseTo(before[1] - 24, 0);
      expect(changed[2]).toBeCloseTo(before[2], 0);
      await expectPanesInsideChart(page);

      const undo = page.getByRole('button', { name: 'Undo', exact: true });
      const redo = page.getByRole('button', { name: 'Redo', exact: true });
      await expect(undo).toBeEnabled();
      await undo.click();
      await expect.poll(async () => (await paneHeights(page)).every((height, index) => Math.abs(height - before[index]!) < 1)).toBe(true);
      await expect(redo).toBeEnabled();
      await redo.click();
      await expect.poll(async () => (await paneHeights(page)).every((height, index) => Math.abs(height - changed[index]!) < 1)).toBe(true);

      await host.evaluate(element => { (element as HTMLElement).style.height = '460px'; });
      await expectPanesInsideChart(page);
      await undo.click();
      await expectPanesInsideChart(page);
      await expect.poll(async () => {
        const heights = await paneHeights(page);
        return Math.max(...heights) - Math.min(...heights);
      }).toBeLessThan(1);
      await redo.click();
      await expectPanesInsideChart(page);
      expect(errors).toEqual([]);
      if (width === 390) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      }
    });
  }
});
