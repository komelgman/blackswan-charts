import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, type EffectScope } from 'vue';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { Price } from '@/model/chart/types';
import { createChartHarness } from '@tests/support/chartHarness';

describe('price grid stability during cursor-centred zoom', () => {
  let h: ReturnType<typeof createChartHarness>;
  let scope: EffectScope;
  beforeEach(async () => {
    vi.useFakeTimers();
    h = createChartHarness({ render: false }); h.addPane('main'); await h.settle();
    scope = effectScope();
  });
  afterEach(() => { scope.stop(); h.dispose(); vi.clearAllTimers(); vi.useRealTimers(); });

  it.each([
    [1000, 12000], [300, 800], [-800, -300], [-800, 300], [1e-100, 2e-100], [1e100, 2e100],
  ].flatMap(([from, to]) => [false, true].flatMap(inverted => [0.15, 0.5, 0.85].map(pivotFraction =>
    ({ from, to, inverted, pivotFraction }),
  ))))('retains prices between density changes: $from … $to inverted=$inverted pivot=$pivotFraction',
    ({ from, to, inverted, pivotFraction }) => {
      const axis = h.chart.paneModel('main').priceAxis;
      axis.noHistoryManagedUpdate({ scale: 'log10', inverted, range: { from: from as Price, to: to as Price } });
      const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
      invalidator.invalidate();
      const pivot = axis.screenSize.main * pivotFraction;
      const anchor = axis.revert(pivot);
      const halfLabel = axis.textStyle.fontSize / 2;
      for (const direction of [-1, 1]) {
        let replacements = 0;
        for (let frame = 0; frame < 40; frame++) {
          const previous = axis.labels.value.map(([position, caption]) => ({ position, caption }));
          const oldSpan = axis.scale.func.translate(axis.range.to) - axis.scale.func.translate(axis.range.from);
          axis.zoom(pivot, direction);
          invalidator.invalidate();
          expect(axis.translate(anchor)).toBeCloseTo(pivot, 6);
          const newSpan = axis.scale.func.translate(axis.range.to) - axis.scale.func.translate(axis.range.from);
          const labels = new Map(axis.labels.value.map(([position, caption]) => [caption, position]));
          let eligible = 0;
          let retained = 0;
          for (const old of previous) {
            const expectedPosition = pivot + (old.position - pivot) * oldSpan / newSpan;
            if (expectedPosition < halfLabel || expectedPosition > axis.screenSize.main - halfLabel) continue;
            eligible++;
            const position = labels.get(old.caption);
            if (position === undefined) continue;
            retained++;
            expect(position).toBeCloseTo(expectedPosition, 6);
          }
          if (retained < eligible - 1) replacements++;
        }
        // Forty 1% wheel steps may change density, but must not rebuild at every step.
        expect(replacements).toBeLessThanOrEqual(2);
      }
    },
  );

  it('restores the exact grid after undo/redo of a grouped wheel gesture', async () => {
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ scale: 'log10', range: { from: 300 as Price, to: 800 as Price } });
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    invalidator.invalidate(); h.chart.clearHistory();
    const before = axis.labels.value;
    for (let i = 0; i < 50; i++) axis.zoom(150, -1);
    invalidator.invalidate();
    const after = axis.labels.value;
    expect(after).not.toEqual(before);
    await vi.runAllTimersAsync();
    h.chart.undo(); invalidator.invalidate();
    expect(axis.labels.value).toEqual(before);
    h.chart.redo(); invalidator.invalidate();
    expect(axis.labels.value).toEqual(after);
  });
});
