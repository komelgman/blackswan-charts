import type { Page } from 'playwright';
import type ChartWidgetTestContext from './ChartWidgetTestContext';

export declare type BoundRect = { x: number, y: number, height: number, width: number };

export async function createMainPaneAndMountChart(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // eslint-disable-next-line
    const { mount, chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
    chart.createPane(newDataSource({ id: 'main', idHelper }, []));
    return mount();
  });
}

export async function createPane(page: Page, paneId: string, initialSize: number): Promise<void> {
  await page.evaluate(async (opts) => {
    // eslint-disable-next-line
    const { chart, idHelper, newDataSource } = (window as any).__test_context as ChartWidgetTestContext;
    chart.createPane(newDataSource({ id: opts.paneId, idHelper }, []), { initialSize: opts.initialSize });
  }, { paneId, initialSize });
}

export async function swapPanes(page: Page, paneId1: string, paneId2: string): Promise<void> {
  await page.evaluate(async (opts) => {
    // eslint-disable-next-line
    const { chart } = (window as any).__test_context as ChartWidgetTestContext;
    chart.swapPanes(opts.paneId1, opts.paneId2);
  }, { paneId1, paneId2 });
}

export async function togglePane(page: Page, paneId: string): Promise<void> {
  await page.evaluate(async (opts) => {
    // eslint-disable-next-line
    const { chart } = (window as any).__test_context as ChartWidgetTestContext;
    chart.togglePane(opts.paneId);
  }, { paneId });
}

export async function removePane(page: Page, paneId: string): Promise<void> {
  await page.evaluate(async (opts) => {
    // eslint-disable-next-line
    const { chart } = (window as any).__test_context as ChartWidgetTestContext;
    chart.removePane(opts.paneId);
  }, { paneId });
}

export async function clearHistory(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // eslint-disable-next-line
    const { chart } = (window as any).__test_context as ChartWidgetTestContext;
    chart.clearHistory();
  });
}

export async function undo(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // eslint-disable-next-line
    const { chart } = (window as any).__test_context as ChartWidgetTestContext;
    chart.undo();
  });
}

export async function redo(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // eslint-disable-next-line
    const { chart } = (window as any).__test_context as ChartWidgetTestContext;
    chart.redo();
  });
}

export async function addDrawingToDataSource(page: Page, dsId: string, drawing: any): Promise<void> {
  await page.evaluate(async (opts) => {
    // eslint-disable-next-line
    const { chart, toRaw } = (window as any).__test_context as ChartWidgetTestContext;
    const mainDs = toRaw(chart.paneModel(opts.dsId).dataSource);
    mainDs.beginTransaction();
    mainDs.add(opts.drawing);
    mainDs.endTransaction();
  }, { drawing, dsId });
}

export async function removeDrawingsFromDataSource(page: Page, dsId: string, drawingId: string): Promise<void> {
  await page.evaluate(async (opts) => {
    // eslint-disable-next-line
    const { chart, toRaw } = (window as any).__test_context as ChartWidgetTestContext;
    const mainDs = toRaw(chart.paneModel(opts.dsId).dataSource);
    mainDs.beginTransaction();
    mainDs.remove(opts.drawingId);
    mainDs.endTransaction();
  }, { drawingId, dsId });
}

export async function dragMouseFromTo(page: Page, x0: number, y0: number, x1: number, y1: number): Promise<void> {
  await page.mouse.move(x0, y0);
  await page.mouse.down({ button: 'left' });
  // @ts-ignore
  await page.mouse.move(x1, y1, { steps: Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) });
  await page.mouse.up();
}

export async function invertPriceAxis(page: Page, paneTestId: string): Promise<void> {
  await page.getByTestId(paneTestId).locator('.priceline >> canvas').last().click({ button: 'right' });
  await page.getByText('Invert scale').click();
}

export async function changePriceAxisScale(page: Page, paneTestId: string, scale: string): Promise<void> {
  await page.getByTestId(paneTestId).locator('.priceline >> canvas').last().click({ button: 'right' });
  await page.getByText(scale).click();
}

export async function zoomPriceAxisByMouseWheel(page: Page, paneTestId: string, delta: number): Promise<void> {
  const pa = await page.getByTestId(paneTestId).locator('.priceline >> canvas').last();
  const paBounds = await pa.boundingBox() as BoundRect;
  await page.mouse.move(paBounds.x + paBounds.width / 2, paBounds.y + paBounds.height / 2);
  await page.mouse.wheel(delta, 0);
}
