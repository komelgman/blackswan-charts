import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChartHarness } from '@tests/support/chartHarness';
import { RecordingPath } from '@tests/support/RecordingCanvas';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import type { DragMoveEvent, MouseClickEvent } from '@blackswan/layered-canvas/model';
import { LineBound, type Line, type Price } from '@/model/chart/types';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import { effectScope } from 'vue';
import fc from 'fast-check';

describe('scale interaction contracts', () => {
  let h: ReturnType<typeof createChartHarness>;
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('Path2D', RecordingPath); h = createChartHarness(); });
  afterEach(() => { h.dispose(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  async function settle() { await h.settle(); await vi.runAllTimersAsync(); }

  it.each(['regular', 'log10'].flatMap(axis => ['regular', 'log10'].flatMap(line =>
    [false, true].map(inverted => ({ axis, line, inverted })),
  )))('horizontal body drag preserves prices: axis=$axis line=$line inverted=$inverted', async ({ axis, line, inverted }) => {
    const ds = h.addPane('main', undefined, [{
      id: 'Line1', type: 'Line', locked: false, visible: true,
      data: { def: [-0.5, 100, 0.5, 200], scale: PriceScales[line], boundType: LineBound.Both,
        style: { lineWidth: 2, color: '#123', fill: 0 } },
    }]);
    const viewport = h.chart.paneModel('main');
    viewport.priceAxis.noHistoryManagedUpdate({ scale: axis, inverted, range: { from: 10 as Price, to: 1000 as Price } });
    await settle(); h.chart.clearHistory();
    const entry = ds.get<Line>('Line1');
    const func = PriceScales[line].func;
    const y = viewport.priceAxis.translate(func.revert((func.translate(100 as Price) + func.translate(200 as Price)) / 2));
    viewport.highlighted = entry;
    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);
    viewport.drag({ x: 480, y, dx: -80, dy: 0 } as DragMoveEvent);
    viewport.endDragging();
    const def = ds.get<Line>('Line1').descriptor.options.data.def;
    expect(def[0]).toBeCloseTo(-0.3, 10);
    expect(def[2]).toBeCloseTo(0.7, 10);
    expect(def[1]).toBeCloseTo(100, 8);
    expect(def[3]).toBeCloseTo(200, 8);
    h.chart.undo(); expect(ds.get<Line>('Line1').descriptor.options.data.def).toEqual([-0.5, 100, 0.5, 200]);
  });

  it('keeps narrow high-price labels distinct and within the viewport', async () => {
    h.addPane('main'); await settle();
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ range: { from: 100000 as Price, to: 100001 as Price } });
    const scope = effectScope();
    try {
      const labels = scope.run(() => new PriceLabelsInvalidator(axis))!;
      labels.invalidate();
      const result = axis.labels.value;
      expect(result.length).toBeGreaterThan(2);
      expect(new Set(result.map(label => label[1])).size).toBe(result.length);
      result.forEach(([position]) => { expect(position).toBeGreaterThanOrEqual(0); expect(position).toBeLessThanOrEqual(600); });
    } finally { scope.stop(); }
  });

  it('keeps log coordinates invertible for prices much smaller than one', async () => {
    h.addPane('main'); await settle();
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ scale: 'log10', range: { from: 1e-18 as Price, to: 2e-18 as Price } });
    const screen = axis.translate(1.5e-18 as Price);
    expect(screen).toBeCloseTo(300, 8);
    expect(axis.revert(screen) / 1.5e-18).toBeCloseTo(1, 12);
  });

  it.each(['regular', 'log10'].flatMap(axis => ['regular', 'log10'].flatMap(line =>
    [false, true].flatMap(inverted => [undefined, 'lineStart', 'lineEnd'].map(handle => ({ axis, line, inverted, handle }))),
  )))('diagonal drag and undo: axis=$axis line=$line inverted=$inverted handle=$handle', async ({ axis, line, inverted, handle }) => {
    const ds = h.addPane('main', undefined, [{
      id: 'Line1', type: 'Line', locked: false, visible: true,
      data: { def: [-0.5, 100, 0.5, 200], scale: PriceScales[line], boundType: LineBound.Both,
        style: { lineWidth: 2, color: '#123', fill: 0 } },
    }]);
    const viewport = h.chart.paneModel('main');
    const price = viewport.priceAxis;
    price.noHistoryManagedUpdate({ scale: axis, inverted, range: { from: 10 as Price, to: 1000 as Price } });
    await settle(); h.chart.clearHistory();
    const func = PriceScales[line].func;
    const initial = ds.get<Line>('Line1').descriptor.options.data.def.slice();
    const anchorPrice = handle === 'lineStart' ? 100 : handle === 'lineEnd' ? 200
      : func.revert((func.translate(100 as Price) + func.translate(200 as Price)) / 2);
    const x = handle === 'lineStart' ? 200 : handle === 'lineEnd' ? 600 : 400;
    const y = price.translate(anchorPrice as Price);
    viewport.highlighted = ds.get('Line1'); viewport.highlightedHandleId = handle;
    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);
    for (let i = 1; i <= 4; i++) {
      // A small grab offset must survive; it must not snap the curve to the mouse.
      viewport.drag({ x: x + i * 10, y: y + 3 - i * 5, dx: -10, dy: 5 } as DragMoveEvent);
    }
    viewport.endDragging(); await settle();
    const moved = ds.get<Line>('Line1').descriptor.options.data.def.slice();
    if (handle === undefined) {
      const movedAnchor = func.revert((func.translate(moved[1] as Price) + func.translate(moved[3] as Price)) / 2);
      expect(price.translate(movedAnchor)).toBeCloseTo(y - 20, 8);
      expect(func.translate(moved[3] as Price) - func.translate(moved[1] as Price))
        .toBeCloseTo(func.translate(200 as Price) - func.translate(100 as Price), 10);
    } else {
      const index = handle === 'lineStart' ? 0 : 2;
      expect(price.translate(moved[index + 1] as Price)).toBeCloseTo(y - 20, 8);
      expect(moved[2 - index]).toBe(initial[2 - index]);
      expect(moved[3 - index]).toBe(initial[3 - index]);
    }
    h.chart.undo(); await settle(); expect(ds.get<Line>('Line1').descriptor.options.data.def).toEqual(initial);
    h.chart.redo(); await settle(); expect(ds.get<Line>('Line1').descriptor.options.data.def).toEqual(moved);
  });

  it('keeps generated linear/log label layouts finite, distinct and separated', async () => {
    h.addPane('main'); await settle();
    const axis = h.chart.paneModel('main').priceAxis;
    const scope = effectScope();
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    try {
      fc.assert(fc.property(fc.integer({ min: -18, max: 12 }), fc.integer({ min: -100, max: 100 }),
        fc.boolean(), fc.boolean(), (exponent, offset, log, inverted) => {
          const unit = 10 ** exponent;
          axis.noHistoryManagedUpdate({ scale: log ? 'log10' : 'regular', inverted,
            range: { from: offset * unit as Price, to: (offset + 2) * unit as Price } });
          invalidator.invalidate();
          const labels = axis.labels.value;
          expect(labels.length).toBeGreaterThan(0);
          expect(new Set(labels.map(([, caption]) => caption)).size).toBe(labels.length);
          labels.forEach(([position], index) => {
            expect(Number.isFinite(position)).toBe(true);
            expect(position).toBeGreaterThanOrEqual(0); expect(position).toBeLessThanOrEqual(600);
            if (index) expect(position - labels[index - 1][0]).toBeGreaterThanOrEqual(axis.textStyle.fontSize * 3 - 0.01);
          });
        }), { seed: 20260928, numRuns: 200 });
    } finally { scope.stop(); }
  });
});
