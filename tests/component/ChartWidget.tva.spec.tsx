import { test, expect } from '@playwright/experimental-ct-vue';
import {
  addDrawingToDataSource,
  clearHistory,
  createMainPaneAndMountChart,
  createPane, dragMouseFromTo,
  redo,
  removeDrawingsFromDataSource,
  undo,
} from './tools/utils';

test.use({ viewport: { width: 1280, height: 720 } });

const drawings = {
  green025VLineNotShared: {
    id: 'vline1',
    title: 'vline1',
    type: 'VLine',
    data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
    locked: false,
    visible: true,
  },

  green025HLineNotShared: {
    id: 'hline1',
    title: 'hline1',
    type: 'HLine',
    data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
    locked: false,
    visible: true,
  },

  red010VLineShared: {
    id: 'vline2',
    title: 'vline2',
    type: 'VLine',
    data: { def: -0.1, style: { lineWidth: 2, fill: 1, color: '#AA0000' } },
    shareWith: '*' as '*',
    locked: false,
    visible: true,
  },

  red010HLineShared: {
    id: 'hline2',
    title: 'hline2',
    type: 'HLine',
    data: { def: -0.1, style: { lineWidth: 2, fill: 1, color: '#AA0000' } },
    shareWith: '*' as '*',
    locked: false,
    visible: true,
  },
};
test('check TVA functionality', async ({ page }) => {
  test.slow();

  await createMainPaneAndMountChart(page);
  await clearHistory(page);
  await expect(page).toHaveScreenshot('one pane, no drawings.png');

  await createPane(page, 'second', 0.3);
  await expect(page).toHaveScreenshot('two panes, no drawings.png');

  await undo(page); // undo create second pane
  await undo(page); // try to undo create main pane (shouldn't do that, because history was cleaned)
  await expect(page).toHaveScreenshot('one pane, no drawings.png');

  await redo(page); // reapply create second pane
  await expect(page).toHaveScreenshot('two panes, no drawings.png');

  await addDrawingToDataSource(page, 'main', drawings.green025HLineNotShared);
  await expect(page).toHaveScreenshot('two panes, green025HLineNotShared on main pane.png');

  await addDrawingToDataSource(page, 'main', drawings.green025VLineNotShared);
  await expect(page).toHaveScreenshot('two panes, green025HLineNotShared and green025VLineNotShared on main pane.png');

  await addDrawingToDataSource(page, 'main', drawings.red010VLineShared);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane.png');

  await addDrawingToDataSource(page, 'main', drawings.red010HLineShared);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and both red Shared on main pane.png');

  await removeDrawingsFromDataSource(page, 'main', drawings.red010HLineShared.id);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane.png');

  const p0 = await page.getByTestId('pane0');
  const p1 = await page.getByTestId('pane1');
  let p0Bounds = await p0.boundingBox();
  let p1Bounds = await p1.boundingBox();

  // move main pane
  // @ts-ignore
  await dragMouseFromTo(page, p0Bounds.x + 1, p0Bounds.y + 1, p0Bounds.x + 11, p0Bounds.y + 11);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved.png');
  // @ts-ignore
  await expect(p0Bounds.height).toBeCloseTo((0.7 / 0.3) * p1Bounds.height, 4);

  // resize panes by mouse
  // @ts-ignore
  await dragMouseFromTo(page, p0Bounds.x + 1, p1Bounds.y - 1, p0Bounds.x + 1, p1Bounds.y - 1 - (p0Bounds.height - p1Bounds.height) / 2);
  await page.mouse.click(10, 10); // reset divider selection

  p0Bounds = await p0.boundingBox();
  p1Bounds = await p1.boundingBox();

  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved, panes resized.png');
  // @ts-ignore
  await expect(p0Bounds.height).toBeCloseTo(p1Bounds.height, 0);

  // move red010VLineShared line
  // @ts-ignore
  await dragMouseFromTo(page, 557, p0Bounds.y + 1, 300, p0Bounds.y + 11);
  await page.mouse.move(10, 10); // reset line selection
  await page.mouse.click(10, 10); // reset line selection
  // eslint-disable-next-line max-len, vue/max-len
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved, panes resized, red line moved.png');

  // --------------------------------------------- UNDO ----------------------------------------------------------------
  // undo red010VLineShared line move
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved, panes resized.png');

  // undo panes resize
  await undo(page);

  p0Bounds = await p0.boundingBox();
  p1Bounds = await p1.boundingBox();
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved.png');
  // @ts-ignore
  await expect(p0Bounds.height).toBeCloseTo((0.7 / 0.3) * p1Bounds.height, 4);

  // undo move main pane
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane.png', { maxDiffPixels: 5 });

  // undo remove red010HLineShared
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and both red Shared on main pane.png', { maxDiffPixels: 5 });

  // undo add red010HLineShared
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane.png', { maxDiffPixels: 5 });

  // undo add red010VLineShared
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, green025HLineNotShared and green025VLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // undo add green025VLineNotShared
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, green025HLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // undo add green025HLineNotShared
  await undo(page);
  await expect(page).toHaveScreenshot('two panes, no drawings.png', { maxDiffPixels: 5 });

  // undo create second pane
  await undo(page);
  await expect(page).toHaveScreenshot('one pane, no drawings.png', { maxDiffPixels: 5 });

  // try undo create main pane
  await undo(page);
  await expect(page).toHaveScreenshot('one pane, no drawings.png', { maxDiffPixels: 5 });

  // --------------------------------------------- REDO ----------------------------------------------------------------
  // redo create second pane
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, no drawings.png', { maxDiffPixels: 5 });

  // redo add green025HLineNotShared
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, green025HLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // redo add green025VLineNotShared
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, green025HLineNotShared and green025VLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // redo add red010VLineShared
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane.png', { maxDiffPixels: 5 });

  // redo add red010HLineShared
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and both red Shared on main pane.png', { maxDiffPixels: 5 });

  // redo remove red010HLineShared
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane.png', { maxDiffPixels: 5 });

  // redo main pane move
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved.png');

  // redo panes resize
  await redo(page);
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved, panes resized.png');

  p0Bounds = await p0.boundingBox();
  p1Bounds = await p1.boundingBox();
  // @ts-ignore
  await expect(p0Bounds.height).toBeCloseTo(p1Bounds.height, 0);

  // redo move red line
  await redo(page);
  // eslint-disable-next-line max-len, vue/max-len
  await expect(page).toHaveScreenshot('two panes, both green NotShared and red010VLineShared on main pane, main pane moved, panes resized, red line moved.png');
});
