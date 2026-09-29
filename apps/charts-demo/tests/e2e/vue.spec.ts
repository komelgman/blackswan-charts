import { test, expect } from '@playwright/test';

test('gallery filters examples and keeps deep links navigable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Charts with room to explore.' })).toBeVisible();
  await expect(page.locator('.example-card')).toHaveCount(7);
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
  await expect(page.locator('.example-card')).toHaveCount(7);
});

for (const id of ['candles', 'panes', 'scales', 'drawings', 'shared', 'history', 'channel']) {
  test(`opens ${id} directly, renders bounded canvases and shows its actual source`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/#/examples/${id}`);
    await expect(page.locator('.chart-host canvas').first()).toBeVisible();
    await expect(page.locator('.viewport')).toHaveCount(['panes', 'shared'].includes(id) ? 2 : 1);
    await expect.poll(() => page.locator('.viewport').evaluateAll(nodes => nodes.every(node =>
      node.clientHeight > 100 && node.clientHeight < 600 && node.clientWidth > 200,
    ))).toBe(true);
    await expect(page.getByRole('tabpanel')).toContainText('export default function create');
    await page.getByRole('tab', { name: 'Setup', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toContainText('new Chart');
    await page.getByRole('tab', { name: 'Data', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toContainText('function marketData');
    await page.getByRole('button', { name: 'Reset ↺' }).click();
    await expect(page.locator('.chart-host canvas').first()).toBeVisible();
    await page.getByRole('link', { name: '← All examples' }).click();
    expect(errors).toEqual([]);
  });
}

test('channel supports button and native handle edits, undo, redo and reset', async ({ page }) => {
  await page.goto('/#/examples/channel');
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
  // Width handle: midpoint of bars 20 and 95, baseline midpoint price 122 + offset 18.
  const x = bounds.x + (57.5 + 4) / 129 * bounds.width;
  const y = bounds.y + (175 - 140) / 95 * bounds.height;
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
  await page.goto('/#/examples/history');
  await page.getByRole('button', { name: 'Move level +5' }).click();
  await page.getByRole('button', { name: 'Restore saved chart' }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Move level +5' }).click();
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled();
  await page.goto('/#/examples/scales');
  await page.getByRole('button', { name: 'Percentage', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Logarithmic', exact: true }).click();
  expect(errors).toEqual([]);
});

test('mobile layout and missing example remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.example-card')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.goto('/#/examples/channel');
  await expect(page.locator('.chart-host canvas').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.goto('/#/examples/missing');
  await expect(page.getByRole('heading', { name: 'Example not found.' })).toBeVisible();
});
