import { test, expect } from '@playwright/experimental-ct-vue';
import type ChartWidgetTestContext from '@tests/component/tools/ChartWidgetTestContext';
import type { VLine } from '@/model/chart/types';
import type { Line, Price } from '@/model/chart/types';
import { dragMouseFromTo, invertPriceAxis } from '@tests/component/tools/utils';

declare global { interface Window { __test_context: ChartWidgetTestContext } }

test.use({ viewport: { width: 1280, height: 720 } });

for (const widget of ['viewport', 'priceline', 'timeline']) {
  test(`wheel over ${widget} zooms locally without scrolling or notifying the page`, async ({ page }) => {
    await page.evaluate(async () => {
      document.documentElement.style.cssText = 'height: auto; overflow: auto';
      document.body.style.cssText = 'height: 2000px; overflow: visible';
      document.getElementById('root')!.style.cssText = 'height: 400px; width: 900px; margin: 150px 100px';
      document.addEventListener('wheel', event => {
        requestAnimationFrame(() => { document.body.dataset.wheelPrevented = String(event.defaultPrevented); });
      }, { capture: true });
      document.body.addEventListener('wheel', () => { document.body.dataset.wheelBubbled = 'true'; });
      const { chart, newDataSource, idHelper, mount } = window.__test_context;
      chart.createPane(newDataSource({ id: 'main', idHelper }, []), {
        priceAxis: { range: { from: 100 as Price, to: 200 as Price } },
      });
      await mount();
      window.scrollTo(0, 80);
    });
    await expect.poll(() => page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.labels.value.length)).toBeGreaterThan(0);
    const axisRange = () => page.evaluate(target => {
      const { chart } = window.__test_context;
      return target === 'priceline' ? chart.paneModel('main').priceAxis.range.from : chart.timeAxis.range.from;
    }, widget);
    const rangeBefore = await axisRange();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.locator(`.${widget}`).hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(axisRange).not.toBe(rangeBefore);
    await expect(page.locator('body')).toHaveAttribute('data-wheel-prevented', 'true');
    expect(await page.locator('body').getAttribute('data-wheel-bubbled')).toBeNull();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

    // Rapid events skipped by zoom throttling must still be consumed.
    const consumed = await page.locator(`.${widget} canvas`).first().evaluate(canvas =>
      Array.from({ length: 5 }, () => {
        const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -120 });
        canvas.dispatchEvent(event);
        return event.defaultPrevented;
      }));
    expect(consumed).toEqual([true, true, true, true, true]);
    expect(await page.locator('body').getAttribute('data-wheel-bubbled')).toBeNull();
    await page.mouse.move(20, 600);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
  });
}

test('restoring panes with the same IDs reconnects price labels and drawing layers through undo and redo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const saved = await page.evaluate(async () => {
    const { chart, newDataSource, idHelper, mount, serialize } = window.__test_context;
    chart.createPane(newDataSource({ id: 'main', idHelper }, [{
      id: 'HLine1', type: 'HLine', visible: true, locked: false,
      data: { def: 120, style: { color: '#00AA00', lineWidth: 2, fill: 0 } },
    }]), { priceAxis: { range: { from: 80 as Price, to: 175 as Price } } });
    const initial = JSON.stringify(serialize());
    await mount(); chart.clearHistory();
    return initial;
  });
  const axisWidth = () => page.locator('.priceline').evaluate(node => node.clientWidth);
  await expect.poll(axisWidth).toBeGreaterThan(20);
  const initialWidth = await axisWidth();

  async function expectConnected() {
    await expect.poll(() => page.evaluate(() => {
      const viewport = window.__test_context.chart.paneModel('main');
      return viewport.priceAxis.contentWidth.value > 0
        && viewport.priceAxis.labels.value.length > 5
        && !!viewport.dataSource.get('HLine1').drawing;
    })).toBe(true);
    await expect.poll(axisWidth).toBe(initialWidth);
    const bounds = (await page.locator('.viewport').boundingBox())!;
    const y = await page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.translate(120 as Price));
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + y + 30);
    await expect.poll(async () => {
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + y);
      return page.evaluate(() => window.__test_context.chart.paneModel('main').highlighted?.descriptor.ref);
    }).toBe('HLine1');
  }

  await expectConnected();
  for (let repeat = 0; repeat < 2; repeat++) {
    await page.evaluate(data => window.__test_context.restore(JSON.parse(data)), saved);
    await expectConnected();
    await page.evaluate(() => window.__test_context.chart.undo());
    await expectConnected();
    await page.evaluate(() => window.__test_context.chart.redo());
    await expectConnected();
  }
  expect(errors).toEqual([]);
});

test('native wheel zoom keeps log labels attached to prices around the cursor', async ({ page }) => {
  await page.evaluate(async () => {
    const { chart, idHelper, newDataSource, mount } = window.__test_context;
    chart.createPane(newDataSource({ id: 'main', idHelper }, []),
      { priceAxis: { scale: 'log10', range: { from: 1000 as Price, to: 12000 as Price } } });
    await mount();
  });
  await expect.poll(() => page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.labels.value.length))
    .toBeGreaterThan(5);
  const bounds = (await page.getByTestId('pane0').locator('.priceline').boundingBox())!;
  const pivot = Math.floor(bounds.height / 4);
  const before = await page.evaluate(screenPivot => {
    const axis = window.__test_context.chart.paneModel('main').priceAxis;
    return { anchor: axis.revert(screenPivot), labels: axis.labels.value };
  }, pivot);
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + pivot);
  for (let i = 0; i < 3; i++) {
    const from = await page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.range.from);
    await page.mouse.wheel(0, -120);
    await expect.poll(() => page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.range.from)).not.toBe(from);
  }
  await expect.poll(() => page.evaluate(initial => {
    const axis = window.__test_context.chart.paneModel('main').priceAxis;
    return initial.labels.filter(([, caption]) => {
      const position = axis.translate(Number(caption) as Price);
      return position >= axis.textStyle.fontSize / 2 && position <= axis.screenSize.main - axis.textStyle.fontSize / 2;
    }).every(([, caption]) => axis.labels.value.some(([, current]) => current === caption));
  }, before)).toBe(true);
  const anchorPosition = await page.evaluate(initial => window.__test_context.chart.paneModel('main').priceAxis.translate(initial.anchor), before);
  expect(anchorPosition).toBeCloseTo(pivot, 1);
});

for (const beforeMount of [true, false]) {
  test(`connects panes ${beforeMount ? 'before' : 'after'} mount and responds to container resize`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluate(async before => {
      const { mount, chart, idHelper, newDataSource } = window.__test_context;
      if (!before) await mount();
      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { preferredSize: 0.3 });
      if (before) await mount();
    }, beforeMount);
    await expect(page.getByTestId('pane1')).toBeVisible();
    const ratio = async () => {
      const a = (await page.getByTestId('pane0').boundingBox())!;
      const b = (await page.getByTestId('pane1').boundingBox())!;
      return a.height / b.height;
    };
    await expect.poll(ratio).toBeCloseTo(7 / 3, 1);
    const previous = (await page.getByTestId('pane0').boundingBox())!;
    await page.setViewportSize({ width: 1000, height: 600 });
    await expect.poll(async () => (await page.getByTestId('pane0').boundingBox())!.height).toBeLessThan(previous.height);
    await expect.poll(ratio).toBeCloseTo(7 / 3, 1);
    expect(errors).toEqual([]);
  });
}

test('native canvas hit testing, drag, keyboard undo/redo and menu reach the model', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(async () => {
    const { mount, chart, idHelper, newDataSource } = window.__test_context;
    chart.createPane(newDataSource({ id: 'main', idHelper }, [{
      id: 'vline1', type: 'VLine', data: { def: 0, style: { color: '#00AA00', lineWidth: 2, fill: 0 } }, locked: false, visible: true,
    }]));
    await mount(); chart.clearHistory();
  });
  await expect.poll(() => page.evaluate(() => !!window.__test_context.chart.paneModel('main').dataSource.get('vline1').drawing)).toBe(true);
  const viewport = page.getByTestId('pane0').locator('.viewport');
  const bounds = (await viewport.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + 30;
  await page.mouse.move(x, y);
  await expect.poll(() => page.evaluate(() => window.__test_context.chart.paneModel('main').highlighted?.descriptor.ref)).toBe('vline1');
  await dragMouseFromTo(page, x, y, x + 80, y);
  const value = () => page.evaluate(() =>
    window.__test_context.chart.paneModel('main').dataSource.get<VLine>('vline1').descriptor.options.data.def);
  await expect.poll(value).not.toBe(0);
  const moved = await value();
  await page.keyboard.press('Control+z');
  await expect.poll(value).toBe(0);
  await page.keyboard.press('Control+Shift+z');
  await expect.poll(value).toBe(moved);
  await invertPriceAxis(page, 'pane0');
  await expect.poll(() => page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.inverted.value)).toBe(1);
  expect(errors).toEqual([]);
});

test('divider drag records dimensions and undo restores them', async ({ page }) => {
  await page.evaluate(async () => {
    const { mount, chart, idHelper, newDataSource } = window.__test_context;
    chart.createPane(newDataSource({ id: 'main', idHelper }, []));
    chart.createPane(newDataSource({ id: 'second', idHelper }, []));
    await mount(); chart.clearHistory();
  });
  await expect.poll(() => page.evaluate(() => window.__test_context.chart.panes.every(p => (p.size ?? 0) > 100))).toBe(true);
  const first = (await page.getByTestId('pane0').boundingBox())!;
  const second = (await page.getByTestId('pane1').boundingBox())!;
  await dragMouseFromTo(page, first.x + 10, second.y - 1, first.x + 10, second.y + 49);
  await expect.poll(async () => (await page.getByTestId('pane0').boundingBox())!.height).toBeCloseTo(first.height + 50, 0);
  await page.evaluate(() => window.__test_context.chart.undo());
  await expect.poll(async () => (await page.getByTestId('pane0').boundingBox())!.height).toBeCloseTo(first.height, 0);
});

test('drags a regular line on a log axis through native pointer events', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(async () => {
    const { chart, newDataSource, idHelper, mount } = window.__test_context;
    chart.createPane(newDataSource({ id: 'main', idHelper }, [{ id: 'Line1', type: 'Line', visible: true, locked: false,
      data: { def: [-0.5, 100, 0.5, 200], boundType: 3, scale: chart.priceScales.regular,
        style: { lineWidth: 2, color: '#00AA00', fill: 0 } } }]),
    { priceAxis: { scale: 'log10', range: { from: 10 as Price, to: 1000 as Price } } });
    await mount(); chart.clearHistory();
  });
  await expect.poll(() => page.evaluate(() => !!window.__test_context.chart.paneModel('main').dataSource.get('Line1').drawing)).toBe(true);
  const bounds = (await page.getByTestId('pane0').locator('.viewport').boundingBox())!;
  const y = await page.evaluate(() => window.__test_context.chart.paneModel('main').priceAxis.translate(150 as Price));
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + y);
  await expect.poll(() => page.evaluate(() => window.__test_context.chart.paneModel('main').highlighted?.descriptor.ref)).toBe('Line1');
  await dragMouseFromTo(page, bounds.x + bounds.width / 2, bounds.y + y, bounds.x + bounds.width / 2 + 60, bounds.y + y);
  const def = () => page.evaluate(() => window.__test_context.chart.paneModel('main').dataSource.get<Line>('Line1').descriptor.options.data.def);
  await expect.poll(async () => (await def())[0]).toBeGreaterThan(-0.5);
  expect((await def())[1]).toBeCloseTo(100, 8);
  expect((await def())[3]).toBeCloseTo(200, 8);
  await page.keyboard.press('Control+z');
  await expect.poll(def).toEqual([-0.5, 100, 0.5, 200]);
  expect(errors).toEqual([]);
});
