import { test, expect } from '@playwright/experimental-ct-vue';
import type { Page } from 'playwright';
import type { PaneOptions } from '@/components/layout';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';
import type ChartWidgetTestContext from './tools/ChartWidgetTestContext';
import { delay } from './tools/utils';
import type { BoundRect } from './tools/utils';

test.use({ viewport: { width: 1280, height: 720 } });

const drawings = {
  green025VLine: {
    id: 'vline2',
    title: 'vline2',
    type: 'VLine',
    data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
    locked: false,
    visible: true,
  },

  green025HLine: {
    id: 'hline2',
    title: 'hline2',
    type: 'HLine',
    data: { def: -0.25, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
    locked: false,
    visible: true,
  },
};

test.describe('one pane', () => {
  test('create pane before mount, no drawings', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ idHelper }, []));

      mount();
    });

    await expect(page).toHaveScreenshot('one pane, no drawings.png');
  });

  test('create pane after mount, no drawings', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount } = (window as any).__test_context as ChartWidgetTestContext;
      mount();
    });

    await page.evaluate(() => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource, delay } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ idHelper }, []));

      return delay();
    });

    await expect(page).toHaveScreenshot('one pane, no drawings.png');
  });

  test('horizontal line', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount } = (window as any).__test_context as ChartWidgetTestContext;
      mount();
    });

    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource, delay } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'main', idHelper }, [d.green025HLine]));

      return delay();
    }, drawings);

    await expect(page).toHaveScreenshot();
  });

  test('vertical line', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, [d.green025VLine]));
    }, drawings);

    await expect(page).toHaveScreenshot();
  });

  test('horizontal and vertical lines, different styles', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, [
        {
          id: 'vline0',
          title: 'vline0',
          type: 'VLine',
          data: { def: -0.1, style: { lineWidth: 1, fill: 0, color: '#AA0000' } },
          locked: false,
          visible: true,
        },
        {
          id: 'vline1',
          title: 'vline1',
          type: 'VLine',
          data: { def: -0.2, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
          locked: false,
          visible: true,
        },
        {
          id: 'vline2',
          title: 'vline2',
          type: 'VLine',
          data: { def: -0.3, style: { lineWidth: 3, fill: 2, color: '#0000AA' } },
          locked: false,
          visible: true,
        },
        {
          id: 'vline3',
          title: 'vline3',
          type: 'VLine',
          data: { def: -0.4, style: { lineWidth: 4, fill: 3, color: '#00AAAA' } },
          locked: false,
          visible: true,
        },
        {
          id: 'vline4',
          title: 'vline4',
          type: 'VLine',
          data: { def: -0.5, style: { lineWidth: 5, fill: 4, color: '#AAAA0A' } },
          locked: false,
          visible: true,
        },

        {
          id: 'hline0',
          title: 'hline0',
          type: 'HLine',
          data: { def: -0.1, style: { lineWidth: 1, fill: 0, color: '#AA0000' } },
          locked: false,
          visible: true,
        },
        {
          id: 'hline1',
          title: 'hline1',
          type: 'HLine',
          data: { def: -0.2, style: { lineWidth: 2, fill: 1, color: '#00AA00' } },
          locked: false,
          visible: true,
        },
        {
          id: 'hline2',
          title: 'hline2',
          type: 'HLine',
          data: { def: -0.3, style: { lineWidth: 3, fill: 2, color: '#0000AA' } },
          locked: false,
          visible: true,
        },
        {
          id: 'hline3',
          title: 'hline3',
          type: 'HLine',
          data: { def: -0.4, style: { lineWidth: 4, fill: 3, color: '#00AAAA' } },
          locked: false,
          visible: true,
        },
        {
          id: 'hline4',
          title: 'hline4',
          type: 'HLine',
          data: { def: -0.5, style: { lineWidth: 5, fill: 4, color: '#AAAA0A' } },
          locked: false,
          visible: true,
        },
      ]));
    });

    await expect(page).toHaveScreenshot();
  });
});

test.describe('two panes', () => {
  test('create panes before mount, no drawings', async ({ page }) => {
    await page.evaluate(async () => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { preferredSize: 0.5 });

      return mount();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });

  test('create panes, one before and one after mount, no drawings', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'main', idHelper }, []));

      return mount();
    });

    await page.evaluate(() => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource, delay } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { preferredSize: 0.5 });

      return delay();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });

  test('create panes after mount, no drawings', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount } = (window as any).__test_context as ChartWidgetTestContext;
      return mount();
    });

    await page.evaluate(() => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource, delay } = (window as any).__test_context as ChartWidgetTestContext;

      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { preferredSize: 0.5 });

      return delay();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });

  test('create panes before mount, no drawings, no pref size', async ({ page }) => {
    await page.evaluate(async () => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []));

      return mount();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });

  test('create panes, one before and one after mount, no drawings, no pref size', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'main', idHelper }, []));

      return mount();
    });

    await page.evaluate(() => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource, delay } = (window as any).__test_context as ChartWidgetTestContext;
      chart.createPane(newDataSource({ id: 'second', idHelper }, []));

      return delay();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });

  test('create panes after mount, no drawings, no pref size', async ({ page }) => {
    await page.evaluate(() => {
      // eslint-disable-next-line
      const { mount } = (window as any).__test_context as ChartWidgetTestContext;
      return mount();
    });

    await page.evaluate(() => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource, delay } = (window as any).__test_context as ChartWidgetTestContext;

      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []));

      return delay();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });
});

test.describe('three panes', () => {
  async function installPanesInOneTime(page: Page, [first, second, third]: Partial<PaneOptions<ViewportOptions>>[]) {
    await page.evaluate(([firstOptions, secondOptions, thirdOptions]: Partial<PaneOptions<ViewportOptions>>[]) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, []), firstOptions);
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), secondOptions);
      chart.createPane(newDataSource({ id: 'third', idHelper }, []), thirdOptions);
    }, [first, second, third]);
  }
  async function installPanesStepByStep(page: Page, [first, second, third]: Partial<PaneOptions<ViewportOptions>>[]) {
    await page.evaluate((options : Partial<PaneOptions<ViewportOptions>>) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, []), options);
    }, first);

    await delay(10);

    await page.evaluate((options : Partial<PaneOptions<ViewportOptions>>) => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;

      chart.createPane(newDataSource({ id: 'second', idHelper }, []), options);
    }, second);

    await delay(10);

    await page.evaluate((options : Partial<PaneOptions<ViewportOptions>>) => {
      // eslint-disable-next-line
      const { chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;

      chart.createPane(newDataSource({ id: 'third', idHelper }, []), options);
    }, third);
  }

  async function getPanesBounds(page: Page): Promise<[BoundRect, BoundRect, BoundRect]> {
    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;
    const pane2 = await page.getByTestId('pane2').boundingBox() as BoundRect;

    return [pane0, pane1, pane2];
  }

  test('vertical line (pane: main, shared: none)', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, [d.green025VLine]));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []));
      chart.createPane(newDataSource({ id: 'third', idHelper }, []));
    }, drawings);

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;
    const pane2 = await page.getByTestId('pane2').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(pane0.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('vertical line (pane: main, shared: all)', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, [{ ...d.green025VLine, shareWith: '*' }]), { preferredSize: 0.5 });
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { preferredSize: 0.25 });
      chart.createPane(newDataSource({ id: 'third', idHelper }, []), { preferredSize: 0.25 });
    }, drawings);

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;
    const pane2 = await page.getByTestId('pane2').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo(2 * pane1.height, 4);
    await expect(pane0.height).toBeCloseTo(2 * pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('vertical line (pane: second, shared: third)', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, [{ ...d.green025VLine, shareWith: ['third'] }]), { preferredSize: 0.2 });
      chart.createPane(newDataSource({ id: 'third', idHelper }, []), { preferredSize: 0.2 });
    }, drawings);

    const pane0 = await page.getByTestId('pane0').boundingBox() as BoundRect;
    const pane1 = await page.getByTestId('pane1').boundingBox() as BoundRect;
    const pane2 = await page.getByTestId('pane2').boundingBox() as BoundRect;

    await expect(pane0.height).toBeCloseTo((0.6 / 0.2) * pane1.height, 4);
    await expect(pane0.height).toBeCloseTo((0.6 / 0.2) * pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed in one time, sum ps less than 1', async ({ page }) => {
    await installPanesInOneTime(page, [{ preferredSize: 0.2 }, { preferredSize: 0.2 }, { preferredSize: 0.2 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(pane0.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed in one time, sum ps greater than 1', async ({ page }) => {
    await installPanesInOneTime(page, [{ preferredSize: 0.8 }, { preferredSize: 0.4 }, { preferredSize: 0.4 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toBeCloseTo(2 * pane1.height, 4);
    await expect(pane0.height).toBeCloseTo(2 * pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed in one time, one pane ps undefined and sum other ps greater than 1', async ({ page }) => {
    await installPanesInOneTime(page, [{ minSize: 100 }, { preferredSize: 0.6 }, { preferredSize: 0.6 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toEqual(100);
    await expect(pane1.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed in one time, one pane ps undefined and sum other ps less than free space', async ({ page }) => {
    await installPanesInOneTime(page, [{ maxSize: 200 }, { preferredSize: 0.1 }, { preferredSize: 0.1 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toEqual(200);
    await expect(pane1.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed step by step, sum ps less than 1', async ({ page }) => {
    await installPanesStepByStep(page, [{ preferredSize: 0.2 }, { preferredSize: 0.2 }, { preferredSize: 0.2 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(pane0.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed step by step, sum ps greater than 1', async ({ page }) => {
    await installPanesStepByStep(page, [{ preferredSize: 0.8 }, { preferredSize: 0.4 }, { preferredSize: 0.4 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toBeCloseTo(2 * pane1.height, 4);
    await expect(pane0.height).toBeCloseTo(2 * pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed step by step, one pane ps undefined and sum other ps greater than 1', async ({ page }) => {
    await installPanesStepByStep(page, [{ minSize: 100 }, { preferredSize: 0.6 }, { preferredSize: 0.6 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toEqual(100);
    await expect(pane1.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('installed step by step, one pane ps undefined and sum other ps less than free space', async ({ page }) => {
    await installPanesStepByStep(page, [{ maxSize: 200 }, { preferredSize: 0.1 }, { preferredSize: 0.1 }]);

    const [pane0, pane1, pane2] = await getPanesBounds(page);

    await expect(pane0.height).toEqual(200);
    await expect(pane1.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });
});
