import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrawingOptions } from '@/model/datasource/types';
import type { Price, UTCTimestamp } from '@/model/chart/types';
import { createChartHarness, observeChart } from '@tests/support/chartHarness';
import { RecordingPath } from '@tests/support/RecordingCanvas';

const line = (id: string, type: 'HLine' | 'VLine', shared = false): DrawingOptions => ({
  id, type, data: { def: -0.25, style: { color: '#00AA00', lineWidth: 2, fill: 1 } },
  locked: false, visible: true, ...(shared ? { shareWith: '*' as const } : {}),
});

describe('chart history through real model operations', () => {
  let h: ReturnType<typeof createChartHarness>;
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10000);
    vi.stubGlobal('Path2D', RecordingPath);
    h = createChartHarness();
    h.addPane('main');
    await h.settle();
    await vi.runOnlyPendingTimersAsync();
    h.chart.clearHistory();
  });
  afterEach(() => { h.dispose(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  async function settle() { await h.settle(); await vi.runAllTimersAsync(); await h.settle(); }

  it('replaces the complete screenshot history scenario with state checkpoints and geometry', async () => {
    const { chart } = h;
    const states = [observeChart(chart)];
    const geometry = () => Array.from(h.canvases, ([id, c]) => ({ id, paints: c.paints }));
    const frames = [structuredClone(geometry())];
    async function step(action: () => void, check: () => void) {
      action(); await settle(); check();
      states.push(observeChart(chart));
      frames.push(structuredClone(geometry()));
    }
    await step(() => h.addPane('second', 0.3), () => {
      expect(chart.panes.map(p => p.id)).toEqual(['main', 'second']);
      expect(chart.panes.map(p => p.size)).toEqual([420, 180]);
    });
    const ds = chart.paneModel('main').dataSource;
    for (const drawing of [line('HLine1', 'HLine'), line('VLine1', 'VLine'), line('VLine2', 'VLine', true), line('HLine2', 'HLine', true)]) {
      await step(() => h.transact(ds, () => ds.add(drawing)), () => {
        expect(ds.get(drawing.id).descriptor.options).toEqual(drawing);
        if (drawing.shareWith) {
          expect(chart.paneModel('second').dataSource.get(['main', drawing.id]).descriptor.options).toEqual(drawing);
        }
      });
    }
    await step(() => h.transact(ds, () => ds.remove('HLine2')), () => {
      expect(Array.from(ds).some(e => e.descriptor.ref === 'HLine2')).toBe(false);
    });
    await step(() => h.drag(chart.paneModel('main'), undefined, 80, 0), () => {
      expect(chart.timeAxis.range.from).toBeCloseTo(-0.8);
      expect(chart.timeAxis.range.to).toBeCloseTo(1.2);
    });
    await step(() => h.resize(1, -120), () => expect(chart.panes.map(p => p.size)).toEqual([300, 300]));
    await step(() => h.drag(chart.paneModel('main'), 'VLine2', 80, 0), () => {
      expect(ds.get<any>('VLine2').descriptor.options.data.def).toBeCloseTo(-0.45);
      expect(chart.paneModel('second').dataSource.get<any>(['main', 'VLine2']).descriptor.options.data.def).toBeCloseTo(-0.45);
    });
    await step(() => h.drag(chart.paneModel('main'), 'VLine2', -40, 0, true), () => {
      expect(ds.get<any>('VLine2').descriptor.options.data.def).toBeCloseTo(-0.45);
      expect(ds.get<any>('vline3').descriptor.options.data.def).toBeCloseTo(-0.35);
    });
    const price = chart.paneModel('main').priceAxis;
    await step(() => price.invert(), () => expect(price.inverted.value).toBe(1));
    await step(() => { price.scale = 'log10'; }, () => expect(price.scale.id).toBe('log10'));
    const timeBefore = { ...chart.timeAxis.range };
    await step(() => chart.timeAxis.zoom(400, 1), () => {
      expect(chart.timeAxis.range.from).toBeCloseTo(timeBefore.from - 0.01);
      expect(chart.timeAxis.range.to).toBeCloseTo(timeBefore.to + 0.01);
    });
    await step(() => price.zoom(150, 1), () => expect(price.range.to - price.range.from).toBeGreaterThan(2));
    await step(() => chart.swapPanes('main', 'second'), () => expect(chart.panes.map(p => p.id)).toEqual(['second', 'main']));
    await step(() => chart.togglePane('second'), () => expect(chart.panes[0].visible).toBe(false));
    await step(() => chart.togglePane('second'), () => expect(chart.panes[0].visible).toBe(true));
    // Coverage missing from the former screenshot flow.
    await step(() => chart.removePane('second'), () => expect(chart.panes.map(p => p.id)).toEqual(['main']));
    await step(() => chart.updateStyle({ backgroundColor: '#112233' }), () => expect(chart.style.backgroundColor).toBe('#112233'));

    for (let i = states.length - 2; i >= 0; i--) {
      chart.undo(); await settle();
      expect(observeChart(chart), `undo checkpoint ${i}`).toEqual(states[i]);
      expect(geometry(), `render after undo ${i}`).toEqual(frames[i]);
    }
    expect(chart.isCanUndo).toBe(false);
    for (let i = 1; i < states.length; i++) {
      chart.redo(); await settle();
      expect(observeChart(chart), `redo checkpoint ${i}`).toEqual(states[i]);
      expect(geometry(), `render after redo ${i}`).toEqual(frames[i]);
    }
    expect(chart.isCanRedo).toBe(false);
  });

  it.each([999, 1000, 1001])('groups zoom at the %i ms boundary deterministically', async (elapsed) => {
    const axis = h.chart.timeAxis;
    axis.zoom(400, 1);
    const first = { ...axis.range };
    vi.setSystemTime(10000 + elapsed);
    axis.zoom(400, 1);
    h.chart.undo();
    expect(axis.range).toEqual(elapsed <= 1000 ? { from: -1, to: 1 } : first);
    expect(h.chart.isCanUndo).toBe(elapsed > 1000);
  });

  it('drops redo after a different action, while preserving the baseline after clear', async () => {
    h.chart.timeAxis.range = { from: 0 as UTCTimestamp, to: 10 as UTCTimestamp };
    h.chart.paneModel('main').priceAxis.range = { from: 0 as Price, to: 20 as Price };
    h.chart.undo();
    h.chart.paneModel('main').priceAxis.invert();
    expect(h.chart.isCanRedo).toBe(false);
    h.chart.clearHistory();
    expect(h.chart.isCanUndo).toBe(false);
    expect(h.chart.timeAxis.range).toEqual({ from: 0, to: 10 });
  });
});
