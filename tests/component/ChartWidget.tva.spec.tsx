import { test, expect } from '@playwright/experimental-ct-vue';
import {
  addDrawingToDataSource, changePriceAxisScale,
  clearHistory,
  createMainPaneAndMountChart,
  createPane, dragMouseFromTo, invertPriceAxis,
  redo,
  removeDrawingsFromDataSource, swapPanes, togglePane,
  undo, zoomPriceAxisByMouseWheel,
} from './tools/utils';
import type { BoundRect } from './tools/utils';

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
  // Listen for all console logs
  page.on('console', (msg) => console.log(msg.text()));

  await createMainPaneAndMountChart(page);
  await clearHistory(page);
  await expect(page).toHaveScreenshot('0 one pane, no drawings.png');

  await createPane(page, 'second', 0.3);
  await expect(page).toHaveScreenshot('1 two panes, no drawings.png');

  await undo(page); // undo create second pane
  await undo(page); // try to undo create main pane (shouldn't do that, because history was cleaned)
  await expect(page).toHaveScreenshot('0 one pane, no drawings.png');

  await redo(page); // reapply create second pane
  await expect(page).toHaveScreenshot('1 two panes, no drawings.png');

  await addDrawingToDataSource(page, 'main', drawings.green025HLineNotShared);
  await expect(page).toHaveScreenshot('2 add green025HLineNotShared on main pane.png');

  await addDrawingToDataSource(page, 'main', drawings.green025VLineNotShared);
  await expect(page).toHaveScreenshot('3 add green025VLineNotShared on main pane.png');

  await addDrawingToDataSource(page, 'main', drawings.red010VLineShared);
  await expect(page).toHaveScreenshot('4 add red010VLineShared on main pane.png');

  await addDrawingToDataSource(page, 'main', drawings.red010HLineShared);
  await expect(page).toHaveScreenshot('5 add red010HLineShared on main pane.png');

  await removeDrawingsFromDataSource(page, 'main', drawings.red010HLineShared.id);
  await expect(page).toHaveScreenshot('6 remove red010HLineShared on main pane.png');

  // move main pane
  const p0 = await page.getByTestId('pane0');
  const p1 = await page.getByTestId('pane1');
  let p0Bounds = await p0.boundingBox() as BoundRect;
  let p1Bounds = await p1.boundingBox() as BoundRect;
  console.log({ p0Bounds, p1Bounds });
  await dragMouseFromTo(page, p0Bounds.x + 1, p0Bounds.y + 1, p0Bounds.x + 11, p0Bounds.y + 11);
  await expect(page).toHaveScreenshot('7 move main pane.png');
  await expect(p0Bounds.height).toBeCloseTo((0.7 / 0.3) * p1Bounds.height, 4);

  // resize panes by mouse
  await dragMouseFromTo(page, p0Bounds.x + 1, p1Bounds.y - 1, p0Bounds.x + 1, p1Bounds.y - 1 - (p0Bounds.height - p1Bounds.height) / 2);
  await page.mouse.click(10, 10); // reset divider selection
  p0Bounds = await p0.boundingBox() as BoundRect;
  p1Bounds = await p1.boundingBox() as BoundRect;
  await expect(page).toHaveScreenshot('8 resize panes, should be equal height.png');
  await expect(p0Bounds.height).toBeCloseTo(p1Bounds.height, 0);

  // move red010VLineShared line
  await dragMouseFromTo(page, 557, p0Bounds.y + 1, 300, p0Bounds.y + 11);
  await page.mouse.move(10, 10); // reset line selection
  await page.mouse.click(10, 10); // reset line selection
  await expect(page).toHaveScreenshot('9 move red010VLineShared line.png');

  // clone red010VLineShared line
  await page.keyboard.down('Control');
  await dragMouseFromTo(page, 300, p0Bounds.y + 1, 350, p0Bounds.y + 1);
  await page.keyboard.up('Control');
  await page.mouse.move(10, 10); // reset line selection
  await page.mouse.click(10, 10); // reset line selection
  await expect(page).toHaveScreenshot('10 clone red010VLineShared line.png');

  await invertPriceAxis(page, 'pane0');
  await expect(page).toHaveScreenshot('11 invert price axis on main pane.png');

  await changePriceAxisScale(page, 'pane0', 'Scale - Log(10)');
  await expect(page).toHaveScreenshot('12 set log10 scale for price axis on main pane.png');

  // zoom main pane by mouse wheel
  await page.mouse.move(p0Bounds.x + p0Bounds.width / 2, p0Bounds.y + p0Bounds.height / 2);
  await page.mouse.wheel(p0Bounds.height * 4, 0);
  await expect(page).toHaveScreenshot('13 zoom time line by mouse wheel on main pane.png');

  // zoom main pane price axis
  await zoomPriceAxisByMouseWheel(page, 'pane0', p0Bounds.height * 4);
  await expect(page).toHaveScreenshot('14 main pane zoom price axis by mouse wheel.png');

  await swapPanes(page, 'main', 'second');
  await expect(page).toHaveScreenshot('15 swap panes.png');

  await togglePane(page, 'second');
  await expect(page).toHaveScreenshot('16 toggle second pane.png');

  await togglePane(page, 'second');
  await expect(page).toHaveScreenshot('15 swap panes.png');
  await expect(page).toHaveScreenshot('17 toggle second pane again.png');

  // todo remove pane
  // todo update styles
  // todo update drawing props
  // todo sendToBack bringToFront etc

  // --------------------------------------------- UNDO ----------------------------------------------------------------
  // undo toggle second pane again
  await undo(page);
  await expect(page).toHaveScreenshot('16 toggle second pane.png');

  // undo toggle second pane
  await undo(page);
  await expect(page).toHaveScreenshot('15 swap panes.png');

  // undo zoom main pane price axis
  await undo(page);
  await expect(page).toHaveScreenshot('14 main pane zoom price axis by mouse wheel.png');

  // undo zoom main pane by mouse wheel
  await undo(page);
  await expect(page).toHaveScreenshot('13 zoom time line by mouse wheel on main pane.png');

  // undo zoom main pane by mouse wheel
  await undo(page);
  await expect(page).toHaveScreenshot('12 set log10 scale for price axis on main pane.png');

  // undo change scale
  await undo(page);
  await expect(page).toHaveScreenshot('11 invert price axis on main pane.png');

  // undo invert main pane
  await undo(page);
  await expect(page).toHaveScreenshot('10 clone red010VLineShared line.png');

  // undo red010VLineShared line clone
  await undo(page);
  await expect(page).toHaveScreenshot('9 move red010VLineShared line.png');

  // undo red010VLineShared line move
  await undo(page);
  await expect(page).toHaveScreenshot('8 resize panes, should be equal height.png');

  // undo panes resize
  await undo(page);
  p0Bounds = await p0.boundingBox() as BoundRect;
  p1Bounds = await p1.boundingBox() as BoundRect;
  await expect(page).toHaveScreenshot('7 move main pane.png');
  await expect(p0Bounds.height).toBeCloseTo((0.7 / 0.3) * p1Bounds.height, 4);

  // undo move main pane
  await undo(page);
  await expect(page).toHaveScreenshot('6 remove red010HLineShared on main pane.png', { maxDiffPixels: 5 });

  // undo remove red010HLineShared
  await undo(page);
  await expect(page).toHaveScreenshot('5 add red010HLineShared on main pane.png', { maxDiffPixels: 5 });

  // undo add red010HLineShared
  await undo(page);
  await expect(page).toHaveScreenshot('4 add red010VLineShared on main pane.png', { maxDiffPixels: 5 });

  // undo add red010VLineShared
  await undo(page);
  await expect(page).toHaveScreenshot('3 add green025VLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // undo add green025VLineNotShared
  await undo(page);
  await expect(page).toHaveScreenshot('2 add green025HLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // undo add green025HLineNotShared
  await undo(page);
  await expect(page).toHaveScreenshot('1 two panes, no drawings.png', { maxDiffPixels: 5 });

  // undo create second pane
  await undo(page);
  await expect(page).toHaveScreenshot('0 one pane, no drawings.png', { maxDiffPixels: 5 });

  // try undo create main pane
  await undo(page);
  await expect(page).toHaveScreenshot('0 one pane, no drawings.png', { maxDiffPixels: 5 });

  // --------------------------------------------- REDO ----------------------------------------------------------------
  // redo create second pane
  await redo(page);
  await expect(page).toHaveScreenshot('1 two panes, no drawings.png', { maxDiffPixels: 5 });

  // redo add green025HLineNotShared
  await redo(page);
  await expect(page).toHaveScreenshot('2 add green025HLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // redo add green025VLineNotShared
  await redo(page);
  await expect(page).toHaveScreenshot('3 add green025VLineNotShared on main pane.png', { maxDiffPixels: 5 });

  // redo add red010VLineShared
  await redo(page);
  await expect(page).toHaveScreenshot('4 add red010VLineShared on main pane.png', { maxDiffPixels: 5 });

  // redo add red010HLineShared
  await redo(page);
  await expect(page).toHaveScreenshot('5 add red010HLineShared on main pane.png', { maxDiffPixels: 5 });

  // redo remove red010HLineShared
  await redo(page);
  await expect(page).toHaveScreenshot('6 remove red010HLineShared on main pane.png', { maxDiffPixels: 5 });

  // redo main pane move
  await redo(page);
  await expect(page).toHaveScreenshot('7 move main pane.png');

  // redo panes resize
  await redo(page);
  await expect(page).toHaveScreenshot('8 resize panes, should be equal height.png');
  p0Bounds = await p0.boundingBox() as BoundRect;
  p1Bounds = await p1.boundingBox() as BoundRect;
  await expect(p0Bounds.height).toBeCloseTo(p1Bounds.height, 0);

  // redo move red line
  await redo(page);
  await expect(page).toHaveScreenshot('9 move red010VLineShared line.png');

  // redo clone red line
  await redo(page);
  await expect(page).toHaveScreenshot('10 clone red010VLineShared line.png');

  // redo invert main pane price axis
  await redo(page);
  await expect(page).toHaveScreenshot('11 invert price axis on main pane.png');

  // redo change price axis scale to log10
  await redo(page);
  await expect(page).toHaveScreenshot('12 set log10 scale for price axis on main pane.png');

  // redo zoom main pane by mouse wheel
  await redo(page);
  await expect(page).toHaveScreenshot('13 zoom time line by mouse wheel on main pane.png');

  // redo zoom main pane price axis
  await redo(page);
  await expect(page).toHaveScreenshot('14 main pane zoom price axis by mouse wheel.png');

  // redo swap panes
  await redo(page);
  await expect(page).toHaveScreenshot('15 swap panes.png');

  // redo toggle second pane
  await redo(page);
  await expect(page).toHaveScreenshot('16 toggle second pane.png');

  // redo toggle second pane again
  await redo(page);
  await expect(page).toHaveScreenshot('15 swap panes.png');
  await expect(page).toHaveScreenshot('17 toggle second pane again.png');
});
