import { test, expect } from '@playwright/test';

test('gallery filters examples and keeps deep links navigable', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Charts with room to explore.' })).toBeVisible();
  await expect(page.locator('.site-header').getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/komelgman/blackswan-charts');
  await expect(page.locator('.example-card')).toHaveCount(11);
  // Previews must load beneath the deployment base path, including lazy images.
  for (const preview of await page.locator('.chart-thumbnail').all()) {
    await preview.scrollIntoViewIfNeeded();
    await expect.poll(() => preview.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.getByRole('button', { name: 'Composition', exact: true }).click();
  await expect(page.locator('.example-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'All examples', exact: true }).click();
  await page.getByRole('searchbox').fill('channel');
  await expect(page.locator('.example-card')).toHaveCount(1);
  await page.locator('.example-card').click();
  await expect(page).toHaveURL(/#\/examples\/channel$/);
  await page.getByRole('link', { name: '← All examples' }).click();
  await expect(page.locator('.example-card')).toHaveCount(1);
  await page.getByRole('searchbox').fill('no-such-example');
  await expect(page.getByText('No examples found.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.example-card')).toHaveCount(11);
});

for (const id of ['basic', 'candles', 'panes', 'scales', 'percentage', 'drawings', 'shared', 'streaming', 'channel', 'history', 'events']) {
  test(`opens ${id} directly, renders bounded canvases and shows its actual source`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`./#/examples/${id}`);
    await expect(page.locator('.chart-host canvas').first()).toBeVisible();
    await expect(page.locator('.viewport')).toHaveCount(['panes', 'shared'].includes(id) ? 2 : 1);
    await expect.poll(() => page.locator('.viewport').evaluateAll(nodes => nodes.every(node =>
      node.clientHeight > 100 && node.clientHeight < 600 && node.clientWidth > 200,
    ))).toBe(true);
    await expect(page.getByRole('tabpanel')).toContainText('export default function create');
    const sourceRoot = 'https://github.com/komelgman/blackswan-charts/blob/master/apps/charts-demo/src/gallery';
    await expect(page.getByRole('link', { name: 'View example on GitHub' })).toHaveAttribute('href', `${sourceRoot}/examples/${id}.ts`);
    await expect(page.getByRole('link', { name: 'Open Example source on GitHub' })).toHaveAttribute('href', `${sourceRoot}/examples/${id}.ts`);
    await page.getByRole('tab', { name: 'Vue', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toContainText('ChartWidget');
    await expect(page.getByRole('tabpanel')).toContainText("blackswan-charts/style.css");
    const component = id === 'events' ? 'ObjectEventChart' : 'ChartEmbed';
    await expect(page.getByRole('link', { name: 'Open Vue source on GitHub' })).toHaveAttribute('href', `${sourceRoot}/${component}.vue`);
    if (id === 'events') {
      await expect(page.getByRole('tabpanel')).toContainText('<ObjectEventTooltip :event="scene.objectEvent" />');
      await page.getByRole('tab', { name: 'Tooltip', exact: true }).click();
      await expect(page.getByRole('tabpanel')).toContainText('event.drawingId');
      await expect(page.getByRole('link', { name: 'Open Tooltip source on GitHub' })).toHaveAttribute('href', `${sourceRoot}/ObjectEventTooltip.vue`);
    }
    if (id === 'basic' || id === 'percentage') {
      await expect(page.getByRole('tab', { name: 'Setup', exact: true })).toHaveCount(0);
    } else {
      await page.getByRole('tab', { name: 'Setup', exact: true }).click();
      await expect(page.getByRole('tabpanel')).toContainText('new Chart');
      await expect(page.getByRole('tabpanel')).not.toContainText('trend');
      await expect(page.getByRole('tabpanel')).not.toContainText('lineStyle');
      await expect(page.getByRole('link', { name: 'Open Setup source on GitHub' })).toHaveAttribute('href', `${sourceRoot}/scene.ts`);
    }
    await page.getByRole('tab', { name: 'Data', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toContainText('function marketData');
    await expect(page.getByRole('link', { name: 'Open Data source on GitHub' })).toHaveAttribute('href', `${sourceRoot}/data.ts`);
    await page.getByRole('tab', { name: 'Types', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toContainText('interface ExampleScene');
    await expect(page.getByRole('link', { name: 'Open Types source on GitHub' })).toHaveAttribute('href', `${sourceRoot}/types.ts`);
    await page.getByRole('button', { name: 'Reset ↺' }).click();
    await expect(page.locator('.chart-host canvas').first()).toBeVisible();
    await page.getByRole('link', { name: '← All examples' }).click();
    expect(errors).toEqual([]);
  });
}

test('percentage series occupy one viewport and undo restores their primary reference', async ({ page }) => {
  await page.goto('./#/examples/percentage');
  const status = page.getByTestId('scene-status');
  await expect(status).toContainText('primary first visible close');
  await expect(page.locator('.viewport')).toHaveCount(1);
  await expect(page.locator('.priceline')).toHaveCount(1);
  await expect(page.getByRole('list', { name: 'Chart series' }).getByRole('listitem')).toHaveCount(3);
  await expect.poll(() => page.locator('.priceline').evaluateAll(nodes => nodes.every(node => node.clientWidth > 20))).toBe(true);
  const initial = await status.innerText();
  const viewport = page.locator('.viewport');
  const bounds = (await viewport.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y, { steps: 8 });
  await page.mouse.up();
  await expect(status).not.toHaveText(initial);
  const panned = await status.innerText();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(status).toHaveText(initial);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(status).toHaveText(panned);
  await page.getByRole('button', { name: 'Reset ↺' }).click();
  await expect(status).toHaveText(initial);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('streaming feed pauses, steps and resets while keeping feed updates out of history', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-01-05T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-05T00:00:01Z'));
  await page.goto('./#/examples/streaming');
  const status = page.getByTestId('scene-status');
  await expect(status).toContainText('80 bars received');
  await page.clock.runFor(2100);
  await expect(status).toContainText('82 bars received');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Pause feed' }).click();
  await page.clock.runFor(5000);
  await expect(status).toContainText('82 bars received · Paused');
  await page.getByRole('button', { name: 'Add one bar' }).click();
  await expect(status).toContainText('83 bars received');
  await page.getByRole('button', { name: 'Resume feed' }).click();
  await page.clock.runFor(1100);
  await expect(status).toContainText('84 bars received');
  await page.getByRole('button', { name: 'Reset ↺' }).click();
  await expect(status).toContainText('80 bars received');
  await page.getByRole('link', { name: '← All examples' }).click();
  await page.clock.runFor(5000);
  await page.locator('a.example-card[href="#/examples/streaming"]').click();
  await expect(status).toContainText('80 bars received');
  await page.clock.runFor(1100);
  await expect(status).toContainText('81 bars received');
  expect(errors).toEqual([]);
});

test('channel supports button and native handle edits, undo, redo and reset', async ({ page }) => {
  await page.goto('./#/examples/channel');
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const redo = page.getByRole('button', { name: 'Redo', exact: true });
  await expect(undo).toBeDisabled();
  await page.getByRole('button', { name: 'Widen channel' }).click();
  await expect(undo).toBeEnabled();
  await undo.click(); await expect(redo).toBeEnabled();
  await redo.click(); await expect(undo).toBeEnabled();
  await page.getByRole('button', { name: 'Reset ↺' }).click();
  await expect(undo).toBeDisabled();
  const viewport = page.locator('.viewport');
  await expect.poll(async () => (await viewport.boundingBox())?.height ?? 0).toBeGreaterThan(100);
  const bounds = (await viewport.boundingBox())!;
  // AUTO fits the candles with native 15% bottom / 10% top padding.
  const close = (i: number) => 100 + i * 0.42 + Math.sin(i * 0.21) * 9 + Math.sin(i * 0.83) * 2;
  const prices = Array.from({ length: 120 }, (_, i): [number, number] => [i === 0 ? close(i) : close(i - 1), close(i)]);
  const low = Math.min(...prices.map(([open, end], i) => Math.min(open, end) - 1.2 - i % 2));
  const high = Math.max(...prices.map(([open, end], i) => Math.max(open, end) + 1.4 + i % 3));
  const paddedSpan = (high - low) / 0.75;
  const priceTop = high + 0.1 * paddedSpan;
  // Width handle: midpoint of bars 20 and 95, baseline midpoint price 122 + offset 18.
  const x = bounds.x + 57.5 / 140 * bounds.width;
  const y = bounds.y + (priceTop - 140) / paddedSpan * bounds.height;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 24, { steps: 8 });
  await page.mouse.up();
  await expect(undo).toBeEnabled();
  await undo.click(); await expect(redo).toBeEnabled();
});

test('history survives restore and scale changes are undoable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#/examples/history');
  const axisWidth = () => page.locator('.priceline').evaluate(node => node.clientWidth);
  await expect.poll(axisWidth).toBeGreaterThan(20);
  const initialWidth = await axisWidth();
  await page.getByRole('button', { name: 'Move levels +5' }).click();
  await page.getByRole('button', { name: 'Restore saved chart' }).click();
  await expect.poll(axisWidth).toBe(initialWidth);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(axisWidth).toBe(initialWidth);
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect.poll(axisWidth).toBe(initialWidth);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'Move levels +5' }).click();
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled();
  await page.goto('./#/examples/scales');
  await page.getByRole('button', { name: 'Percentage', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Logarithmic', exact: true }).click();
  expect(errors).toEqual([]);
});

test('mobile layout and missing example remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.locator('.example-card')).toHaveCount(11);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.goto('./#/examples/channel');
  await expect(page.locator('.chart-host canvas').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.goto('./#/examples/missing');
  await expect(page.getByRole('heading', { name: 'Example not found.' })).toBeVisible();
});
