import type { Page } from 'playwright';
import type ChartWidgetTestContext from './ChartWidgetTestContext';

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
  await page.mouse.move(x1, y1);
  await page.mouse.up();
}
