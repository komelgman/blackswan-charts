import { test, expect } from '@playwright/experimental-ct-vue';
import type ChartWidgetTestContext from './tools/ChartWidgetTestContext';

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
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { initialSize: 0.5 });

      return mount();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox();
    const pane1 = await page.getByTestId('pane1').boundingBox();

    // @ts-ignore
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
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { initialSize: 0.5 });

      return delay();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox();
    const pane1 = await page.getByTestId('pane1').boundingBox();

    // @ts-ignore
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
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { initialSize: 0.5 });

      return delay();
    });

    const pane0 = await page.getByTestId('pane0').boundingBox();
    const pane1 = await page.getByTestId('pane1').boundingBox();

    // @ts-ignore
    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    await expect(page).toHaveScreenshot('two panes, no drawings.png');
  });
});

test.describe('three panes', () => {
  test('vertical line (pane: main, shared: none)', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, [d.green025VLine]));
      chart.createPane(newDataSource({ id: 'second', idHelper }, []));
      chart.createPane(newDataSource({ id: 'third', idHelper }, []));
    }, drawings);

    const pane0 = await page.getByTestId('pane0').boundingBox();
    const pane1 = await page.getByTestId('pane1').boundingBox();
    const pane2 = await page.getByTestId('pane2').boundingBox();

    // @ts-ignore
    await expect(pane0.height).toBeCloseTo(pane1.height, 4);
    // @ts-ignore
    await expect(pane0.height).toBeCloseTo(pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('vertical line (pane: main, shared: all)', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, [{ ...d.green025VLine, shareWith: '*' }]), { initialSize: 0.5 });
      chart.createPane(newDataSource({ id: 'second', idHelper }, []), { initialSize: 0.25 });
      chart.createPane(newDataSource({ id: 'third', idHelper }, []), { initialSize: 0.25 });
    }, drawings);

    const pane0 = await page.getByTestId('pane0').boundingBox();
    const pane1 = await page.getByTestId('pane1').boundingBox();
    const pane2 = await page.getByTestId('pane2').boundingBox();

    // @ts-ignore
    await expect(pane0.height).toBeCloseTo(2 * pane1.height, 4);
    // @ts-ignore
    await expect(pane0.height).toBeCloseTo(2 * pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });

  test('vertical line (pane: second, shared: third)', async ({ page }) => {
    await page.evaluate((d) => {
      // eslint-disable-next-line
      const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
      mount();

      chart.createPane(newDataSource({ id: 'main', idHelper }, []));
      chart.createPane(newDataSource({ id: 'second', idHelper }, [{ ...d.green025VLine, shareWith: ['third'] }]), { initialSize: 0.2 });
      chart.createPane(newDataSource({ id: 'third', idHelper }, []), { initialSize: 0.2 });
    }, drawings);

    const pane0 = await page.getByTestId('pane0').boundingBox();
    const pane1 = await page.getByTestId('pane1').boundingBox();
    const pane2 = await page.getByTestId('pane2').boundingBox();

    // @ts-ignore
    await expect(pane0.height).toBeCloseTo((0.6 / 0.2) * pane1.height, 4);
    // @ts-ignore
    await expect(pane0.height).toBeCloseTo((0.6 / 0.2) * pane2.height, 4);
    await expect(page).toHaveScreenshot();
  });
});
