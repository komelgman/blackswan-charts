import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { Price } from '@/model/chart/types';
import { createChartHarness } from '@tests/support/chartHarness';
import fc from 'fast-check';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';

function assertCoverage(axis: PriceAxis) {
  const height = axis.screenSize.main;
  const spacing = axis.textStyle.fontSize * 3;
  const labels = axis.labels.value;
  const context = JSON.stringify({ range: axis.range, height, font: axis.textStyle.fontSize,
    scale: axis.scale.id, inverted: axis.inverted.value, labels });
  expect(labels.length, context).toBeGreaterThanOrEqual(Math.max(1, Math.floor(height / (2.5 * spacing))));
  expect(new Set(labels.map(([, caption]) => caption)).size, context).toBe(labels.length);
  const boundaries = [0, ...labels.map(([position]) => position), height];
  for (let i = 1; i < boundaries.length; i++) {
    expect(boundaries[i] - boundaries[i - 1], context).toBeLessThanOrEqual(3 * spacing + 1e-8);
    if (i > 1 && i < boundaries.length - 1) {
      expect(boundaries[i] - boundaries[i - 1], context).toBeGreaterThanOrEqual(spacing - 0.01);
    }
  }
  for (const [position, caption] of labels) {
    expect(position, context).toBeGreaterThanOrEqual(axis.textStyle.fontSize / 2);
    expect(position, context).toBeLessThanOrEqual(height - axis.textStyle.fontSize / 2);
    const displayedValue = axis.scale.id === 'percentage'
      ? Number.parseFloat(caption) / 100 * Math.abs(axis.referencePrice.value!) + axis.referencePrice.value!
      : Number(caption);
    expect(Math.abs(axis.translate(displayedValue as Price) - position), context).toBeLessThan(0.1);
  }
}

function assertSmoothSpacing(axis: PriceAxis) {
  const gaps = axis.labels.value.slice(1).map(([position], i) => position - axis.labels.value[i][0]);
  if (gaps.length < 2) return;
  expect(Math.max(...gaps) / Math.min(...gaps), JSON.stringify({ range: axis.range,
    scale: axis.scale.id, height: axis.screenSize.main, labels: axis.labels.value })).toBeLessThanOrEqual(1.5001);
}

describe('price label coverage without browser rendering', () => {
  let h: ReturnType<typeof createChartHarness>;
  let scope: EffectScope;
  beforeEach(async () => {
    h = createChartHarness({ render: false }); h.addPane('main'); await h.settle();
    scope = effectScope();
  });
  afterEach(() => { scope.stop(); h.dispose(); });

  it('fills a tall logarithmic axis between decimal landmarks', () => {
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ scale: 'log10', range: { from: 300 as Price, to: 800 as Price },
      screenSize: { ...axis.screenSize, main: 1000 } });
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    invalidator.invalidate();
    const positions = axis.labels.value.map(([position]) => position);
    const spacing = axis.textStyle.fontSize * 3;
    expect(positions.length).toBeGreaterThanOrEqual(Math.floor(1000 / (2.5 * spacing)));
    const boundaries = [0, ...positions, 1000];
    for (let i = 1; i < boundaries.length; i++) {
      expect(boundaries[i] - boundaries[i - 1]).toBeLessThanOrEqual(3 * spacing);
    }
  });

  it.each([
    [100000, 1200000], [1000, 12000], [300, 800], [-800, -300], [-800, 300],
    [0, 1e12], [1e-100, 2e-100], [1e100, 2e100], [100000, 100001],
  ])('keeps logarithmic grid spacing smooth throughout %s … %s', (from, to) => {
    const axis = h.chart.paneModel('main').priceAxis;
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    for (const height of [600, 1200, 2000]) {
      axis.noHistoryManagedUpdate({ scale: 'log10', range: { from: from as Price, to: to as Price },
        screenSize: { ...axis.screenSize, main: height } });
      invalidator.invalidate();
      assertCoverage(axis);
      assertSmoothSpacing(axis);
    }
  });

  it.each([-300, -280, -100, -24, -18, -8, -2, 0, 2, 8, 18, 24, 100, 280, 300])(
    'preserves coverage, accuracy and smoothness at magnitude 10^%s', exponent => {
      const axis = h.chart.paneModel('main').priceAxis;
      const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
      const unit = 10 ** exponent;
      for (const [left, right] of [[1, 2], [-2, -1], [-100, 3], [1, 1e6], [100, 100.00001]]) {
        for (const scale of ['regular', 'log10', 'percentage']) {
          for (const height of [200, 600, 2000]) {
            axis.referencePrice.value = left * unit as Price;
            axis.noHistoryManagedUpdate({ scale, range: { from: left * unit as Price, to: right * unit as Price },
              screenSize: { ...axis.screenSize, main: height } });
            invalidator.invalidate();
            assertCoverage(axis);
            assertSmoothSpacing(axis);
          }
        }
      }
    },
  );

  it('keeps the same log tick prices on inversion and during a small pan', () => {
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ scale: 'log10', range: { from: 1000 as Price, to: 12000 as Price } });
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    invalidator.invalidate();
    const original = axis.labels.value.map(([position, caption]) => ({ position, caption }));
    axis.noHistoryManagedUpdate({ inverted: true });
    invalidator.invalidate();
    expect(axis.labels.value.map(([, caption]) => caption)).toEqual(original.map(label => label.caption).reverse());
    const from = axis.revert(20);
    const to = axis.revert(axis.screenSize.main + 20);
    axis.noHistoryManagedUpdate({ range: { from, to } });
    invalidator.invalidate();
    const retained = axis.labels.value.filter(([, caption]) => original.some(label => label.caption === caption));
    expect(retained.length).toBeGreaterThanOrEqual(original.length - 2);
    for (const [position, caption] of retained) {
      const previous = original.find(label => label.caption === caption)!;
      expect(position).toBeCloseTo(axis.screenSize.main - previous.position - 20, 6);
    }
    assertSmoothSpacing(axis);
  });

  it.each([
    [300, 800], [-800, -300], [-800, 300], [0, 1e12], [-1e12, 1e-6],
    [1e-6, 1e12], [1e-18, 2e-18], [100000, 100001], [0, 100], [1e15, 1e15 + 1000], [1e-24, 2e-24],
    [-17, -16.9], [8, 8.0001], [44, 45],
  ])('covers the whole range %s … %s at different sizes, fonts and orientations', (from, to) => {
    const axis = h.chart.paneModel('main').priceAxis;
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    for (const scale of ['regular', 'log10', 'percentage']) {
      axis.referencePrice.value = (from || 100) as Price;
      for (const fontSize of [10, 24]) {
        for (const height of [90, 200, 600, 1000, 2000]) {
          for (const inverted of [false, true]) {
            axis.noHistoryManagedUpdate({ scale, inverted, range: { from: from as Price, to: to as Price },
              screenSize: { ...axis.screenSize, main: height }, textStyle: { ...axis.textStyle, fontSize } });
            invalidator.invalidate();
            assertCoverage(axis);
          }
        }
      }
    }
  });

  it('retains a uniform fractional step at the exact minimum pixel spacing', () => {
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ scale: 'regular', range: { from: 1 as Price, to: 1.000001 as Price },
      screenSize: { ...axis.screenSize, main: 960 }, textStyle: { ...axis.textStyle, fontSize: 8 } });
    scope.run(() => new PriceLabelsInvalidator(axis))!.invalidate();
    assertCoverage(axis);
    assertSmoothSpacing(axis);
    expect(axis.labels.value.length).toBeGreaterThanOrEqual(39);
  });

  it('recalculates coverage when the pane grows, collapses and reopens', async () => {
    const axis = h.chart.paneModel('main').priceAxis;
    axis.noHistoryManagedUpdate({ scale: 'log10', range: { from: 300 as Price, to: 800 as Price },
      screenSize: { ...axis.screenSize, main: 200 } });
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    invalidator.invalidate();
    const smallCount = axis.labels.value.length;
    axis.noHistoryManagedUpdate({ screenSize: { ...axis.screenSize, main: 1000 } });
    await nextTick();
    assertCoverage(axis);
    expect(axis.labels.value.length).toBeGreaterThan(smallCount * 2);
    axis.noHistoryManagedUpdate({ screenSize: { ...axis.screenSize, main: 0 } });
    await nextTick();
    expect(axis.labels.value).toEqual([]);
    axis.noHistoryManagedUpdate({ screenSize: { ...axis.screenSize, main: 1000 } });
    await nextTick();
    assertCoverage(axis);
  });

  it('maintains coverage across generated magnitudes, spans and viewport sizes', () => {
    const axis = h.chart.paneModel('main').priceAxis;
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    fc.assert(fc.property(
      fc.integer({ min: -280, max: 280 }), fc.integer({ min: -6, max: 12 }),
      fc.integer({ min: -100, max: 100 }), fc.integer({ min: 90, max: 2400 }),
      fc.integer({ min: 8, max: 28 }), fc.constantFrom('regular', 'log10', 'percentage'), fc.boolean(),
      (exponent, spanExponent, offset, height, fontSize, scale, inverted) => {
        const unit = 10 ** exponent;
        const from = offset * unit;
        const to = from + 10 ** spanExponent * unit;
        axis.referencePrice.value = (from || unit) as Price;
        axis.noHistoryManagedUpdate({ scale, inverted, range: { from: from as Price, to: to as Price },
          screenSize: { ...axis.screenSize, main: height }, textStyle: { ...axis.textStyle, fontSize } });
        invalidator.invalidate();
        assertCoverage(axis);
        assertSmoothSpacing(axis);
      },
    ), { seed: 20260928, numRuns: 1000 });
  });
});
