import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LineFillStyle } from '@/model/chart/types';
import type { DrawingOptions } from '@/model/datasource/types';
import { renderPriceLabels } from '@/model/chart/axis/layers/renderPriceLabels';
import { renderTimeLabels } from '@/model/chart/axis/layers/renderTimeLabels';
import { renderViewportGrid } from '@/model/chart/viewport/layers/renderViewportGrid';
import { createChartHarness } from '../support/chartHarness';
import { RecordingCanvas, RecordingPath } from '../support/RecordingCanvas';

describe('drawing contracts without pixels or system fonts', () => {
  let h: ReturnType<typeof createChartHarness>;
  beforeEach(() => {
    vi.useFakeTimers(); vi.stubGlobal('Path2D', RecordingPath);
    h = createChartHarness();
  });
  afterEach(() => { h.dispose(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  async function settle() { await h.settle(); await vi.runAllTimersAsync(); }
  const line = (type: string, fill = LineFillStyle.Solid, shareWith?: '*' | string[]): DrawingOptions => ({
    id: `${type}1`, type, visible: true, locked: false, shareWith,
    data: { def: -0.25, style: { color: '#00AA00', lineWidth: 2, fill } },
  });

  it.each([
    [LineFillStyle.Solid, []], [LineFillStyle.Dotted, [4, 6]],
    [LineFillStyle.Dashed, [10, 10]], [LineFillStyle.LargeDashed, [30, 10]],
    [LineFillStyle.SparseDotted, [20, 8, 6, 8, 6, 8, 6, 8]],
  ] as const)('renders exact horizontal geometry and dash pattern %i', async (fill, dash) => {
    const ds = h.addPane('main', undefined, [line('HLine', fill)]);
    await settle();
    expect(h.canvases.get('main')!.paints).toMatchObject([{
      op: 'stroke', strokeStyle: '#00AA00', lineWidth: 2, dash: [...dash],
      path: [{ op: 'moveTo', args: [0, 375] }, { op: 'lineTo', args: [800, 375] }],
    }]);
    h.transact(ds, () => ds.update('HLine1', { visible: false }));
    await settle(); expect(h.canvases.get('main')!.paints).toEqual([]);
    h.chart.undo(); await settle(); expect(h.canvases.get('main')!.paints).toHaveLength(1);
    h.transact(ds, () => ds.update('HLine1', { data: { def: 2 } }));
    await settle(); expect(h.canvases.get('main')!.paints).toEqual([]);
  });

  it.each([
    { shareWith: undefined, owners: ['second'] },
    { shareWith: '*' as const, owners: ['main', 'second', 'third'] },
    { shareWith: ['third'], owners: ['second', 'third'] },
  ])('projects a vertical line to $owners', async ({ shareWith, owners }) => {
    h.addPane('main');
    const ds = h.addPane('second', 0.2, [line('VLine', LineFillStyle.Solid, shareWith)]);
    h.addPane('third', 0.2);
    await settle();
    for (const pane of h.chart.panes) {
      const paints = h.canvases.get(pane.id)!.paints;
      if (!owners.includes(pane.id)) expect(paints).toEqual([]);
      else expect(paints).toMatchObject([{
        path: [{ op: 'moveTo', args: [300, 0] }, { op: 'lineTo', args: [300, pane.size] }],
      }]);
    }
    h.chart.clearHistory();
    h.transact(ds, () => ds.update('VLine1', { data: { def: 0.5 } }));
    await settle();
    for (const id of owners) expect(h.canvases.get(id)!.paints[0].path![0].args[0]).toBe(600);
    h.chart.undo(); await settle();
    for (const id of owners) expect(h.canvases.get(id)!.paints[0].path![0].args[0]).toBe(300);
    h.chart.redo(); await settle();
    for (const id of owners) expect(h.canvases.get(id)!.paints[0].path![0].args[0]).toBe(600);
  });

  it.each([1, 2])('renders labels and grid through the same functions used by workers (DPR %i)', (dpr) => {
    const canvas = new RecordingCanvas();
    const payload = { width: 200, height: 100, dpr, labelColor: '#abc', labelFont: '12px Test',
      labels: [[25, 'one'], [75, 'two']] as [number, string][] };
    renderPriceLabels(canvas.asContext(), { ...payload, xPos: 190 });
    expect(canvas.canvas).toEqual({ width: 200 * dpr, height: 100 * dpr });
    expect(canvas.paints).toMatchObject([
      { op: 'text', text: 'one', x: 190, y: 25, textAlign: 'end', textBaseline: 'middle',
        fillStyle: '#abc', font: '12px Test', transform: [dpr, 0, 0, dpr, 0, 0] },
      { text: 'two', x: 190, y: 75 },
    ]);
    canvas.clearRect();
    renderTimeLabels(canvas.asContext(), { ...payload, yPos: 50 });
    expect(canvas.paints).toMatchObject([{ text: 'one', x: 25, y: 50, textAlign: 'center' }, { text: 'two', x: 75, y: 50 }]);
    canvas.clearRect();
    renderViewportGrid(canvas.asContext(), { ...payload, priceLabels: [[25.2, '']], timeLabels: [[75.7, '']], color: '#123' });
    expect(canvas.paints[canvas.paints.length - 1]).toMatchObject({ strokeStyle: '#123', lineWidth: 1, path: [
      { op: 'moveTo', args: [0, 25] }, { op: 'lineTo', args: [200, 25] },
      { op: 'moveTo', args: [76, 0] }, { op: 'lineTo', args: [76, 100] },
    ] });
    expect(canvas.font).toBe('10px sans-serif');
    expect(canvas.strokeStyle).toBe('#000');
  });

  it('restores drawing order, styles and notifications after removing and undoing a pane', async () => {
    const ds = h.addPane('main', undefined, [line('VLine', LineFillStyle.Solid, '*'), line('HLine')]);
    h.addPane('second'); await settle(); h.chart.clearHistory();
    const original = structuredClone(h.canvases.get('main')!.paints);
    h.transact(ds, () => {
      ds.update('VLine1', { data: { style: { color: '#123456', lineWidth: 4 } } });
      ds.remove('HLine1');
    });
    await settle();
    expect(h.canvases.get('main')!.paints).toMatchObject([{ strokeStyle: '#123456', lineWidth: 4 }]);
    h.chart.undo(); await settle();
    expect(h.canvases.get('main')!.paints).toEqual(original);
    h.chart.removePane('second'); await settle();
    expect(h.canvases.has('second')).toBe(false);
    h.chart.undo(); await settle();
    // Editing a shared projection must still reach its owner after reattachment.
    const projection = h.chart.paneModel('second').dataSource;
    h.transact(projection, () => projection.update(['main', 'VLine1'], { data: { def: 0.5 } }));
    await settle();
    for (const id of ['main', 'second']) expect(h.canvases.get(id)!.paints[0].path![0].args[0]).toBe(600);
    h.chart.undo(); await settle();
    for (const id of ['main', 'second']) expect(h.canvases.get(id)!.paints[0].path![0].args[0]).toBe(300);
  });
});
