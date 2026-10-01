import { expect, test } from '@playwright/test';

test('object events expose identity and named handles without disabling chart edits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#/examples/events');
  const viewport = page.locator('.viewport');
  const tooltip = page.getByTestId('object-event-tooltip');
  await expect.poll(() => viewport.evaluate(node => node.clientWidth)).toBeGreaterThan(200);
  await expect.poll(() => page.locator('.priceline').evaluate(node => node.clientWidth)).toBeGreaterThan(20);
  const bounds = (await viewport.boundingBox())!;
  // The marker is bar 68 in the example's 140-bar initial time window.
  const markerX = bounds.width * 68 / 140;
  await viewport.click({ position: { x: markerX, y: 30 } });
  await expect(tooltip).toContainText('VLine');
  await expect(tooltip).toContainText('VLine1');
  await expect(tooltip).toContainText('main');
  await expect(tooltip).toContainText('click');
  await viewport.dblclick({ position: { x: markerX, y: 30 } });
  await expect(tooltip).toContainText('dblclick');

  // Once selected, a vertical line exposes its named midpoint handle.
  await viewport.click({ position: { x: markerX, y: bounds.height / 2 } });
  await expect(tooltip).toContainText('Handle');
  await expect(tooltip).toContainText('center');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  await page.mouse.move(bounds.x + markerX, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + markerX + 30, bounds.y + bounds.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(tooltip).toBeHidden();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await viewport.click({ position: { x: markerX, y: 30 } });
  await expect(tooltip).toBeVisible();
  await viewport.click({ position: { x: bounds.width - 20, y: 20 } });
  await expect(tooltip).toBeHidden();
  await viewport.click({ position: { x: markerX, y: 30 } });
  await page.mouse.wheel(0, -120);
  await expect(tooltip).toBeHidden();
  await page.getByRole('button', { name: 'Reset ↺' }).click();
  await expect(tooltip).toBeHidden();
  expect(errors).toEqual([]);
});

test('object event tooltip stays inside a narrow chart', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/examples/events');
  const viewport = page.locator('.viewport');
  await expect.poll(() => page.locator('.priceline').evaluate(node => node.clientWidth)).toBeGreaterThan(20);
  const bounds = (await viewport.boundingBox())!;
  await viewport.click({ position: { x: bounds.width * 68 / 140, y: bounds.height - 20 } });
  const tooltip = page.getByTestId('object-event-tooltip');
  await expect(tooltip).toBeVisible();
  const chart = (await page.locator('.embedded-chart-host').boundingBox())!;
  const panel = (await tooltip.boundingBox())!;
  expect(panel.x).toBeGreaterThanOrEqual(chart.x);
  expect(panel.y).toBeGreaterThanOrEqual(chart.y);
  expect(panel.x + panel.width).toBeLessThanOrEqual(chart.x + chart.width);
  expect(panel.y + panel.height).toBeLessThanOrEqual(chart.y + chart.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test.describe('high pixel density', () => {
  test.use({ deviceScaleFactor: 2, viewport: { width: 802, height: 1100 } });

  test('hits the visible object and its handle after a container resize', async ({ page }) => {
    await page.goto('./#/examples/events');
    await page.locator('.chart-host').evaluate(element => {
      (element as HTMLElement).style.width = '740px';
      (element as HTMLElement).style.height = '440px';
    });
    const viewport = page.locator('.viewport');
    await expect.poll(() => page.locator('.priceline').evaluate(node => node.clientWidth)).toBeGreaterThan(20);
    await expect.poll(() => viewport.locator('.layered-canvas__layer').evaluateAll(canvases => canvases.every(canvas => {
      const element = canvas as HTMLCanvasElement;
      const bounds = element.getBoundingClientRect();
      return element.width === Math.floor(bounds.width * devicePixelRatio)
        && element.height === Math.floor(bounds.height * devicePixelRatio);
    }))).toBe(true);
    const bounds = (await viewport.boundingBox())!;
    const markerX = bounds.width * 68 / 140;
    const tooltip = page.getByTestId('object-event-tooltip');
    // Hit testing must use the same CSS position at any device pixel density.
    await viewport.click({ position: { x: markerX, y: 30 } });
    await expect(tooltip).toContainText('VLine1');
    await viewport.click({ position: { x: markerX, y: bounds.height / 2 } });
    await expect(tooltip).toContainText('center');
    await viewport.click({ position: { x: markerX / 2, y: 30 } });
    await expect(tooltip).toBeHidden();
  });
});

for (const axis of ['time', 'price'] as const) {
  test(`${axis} axis wheel and drag dismiss details while retaining axis navigation`, async ({ page }) => {
    await page.goto('./#/examples/events');
    const viewport = page.locator('.viewport');
    const tooltip = page.getByTestId('object-event-tooltip');
    const undo = page.getByRole('button', { name: 'Undo', exact: true });
    async function showDetails() {
      await expect.poll(() => page.locator('.priceline').evaluate(node => node.clientWidth)).toBeGreaterThan(20);
      const bounds = (await viewport.boundingBox())!;
      await viewport.click({ position: { x: bounds.width * 68 / 140, y: 30 } });
      await expect(tooltip).toContainText('VLine1');
    }
    await showDetails();
    const axisWidget = page.locator(axis === 'time' ? '.timeline' : '.priceline');
    await axisWidget.hover();
    await page.mouse.wheel(0, -120);
    await expect(tooltip).toBeHidden();
    await expect(undo).toBeEnabled();

    await page.getByRole('button', { name: 'Reset ↺' }).click();
    await showDetails();
    const axisBounds = (await axisWidget.boundingBox())!;
    const x = axisBounds.x + axisBounds.width / 2;
    const y = axisBounds.y + axisBounds.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (axis === 'time' ? 20 : 0), y + (axis === 'price' ? 20 : 0), { steps: 5 });
    await page.mouse.up();
    await expect(tooltip).toBeHidden();
    await expect(undo).toBeEnabled();
  });
}
