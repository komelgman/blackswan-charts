import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { layoutPanes, resizePanes } from '../src/model/pane-layout';
import type { PaneDescriptor } from '../src/model';

function panes(options: Partial<PaneDescriptor<unknown>>[]) {
  return options.map((o, i) => ({ id: String(i), model: {}, visible: true, minSize: 100, ...o }));
}

describe('pane layout without DOM', () => {
  const cases = [
    { name: 'one pane', options: [{}], expected: [600] },
    { name: 'equal panes', options: [{}, {}], expected: [300, 300] },
    { name: 'preferred second pane', options: [{}, { preferredSize: 0.3 }], expected: [420, 180] },
    { name: 'preferences total less than one', options: [0.2, 0.2, 0.2].map(preferredSize => ({ preferredSize })), expected: [200, 200, 200] },
    { name: 'preferences total greater than one', options: [0.8, 0.4, 0.4].map(preferredSize => ({ preferredSize })), expected: [300, 150, 150] },
    { name: 'unpreferred minimum', options: [{}, { preferredSize: 0.6 }, { preferredSize: 0.6 }], expected: [100, 250, 250] },
    { name: 'unpreferred maximum', options: [{ maxSize: 200 }, { preferredSize: 0.1 }, { preferredSize: 0.1 }], expected: [200, 200, 200] },
    { name: 'shared line panes', options: [{}, { preferredSize: 0.2 }, { preferredSize: 0.2 }], expected: [360, 120, 120] },
  ];
  for (const stepwise of [false, true]) {
    it.each(cases)(`$name (stepwise=${stepwise})`, ({ options, expected }) => {
      const items = panes(options);
      if (stepwise) {
        for (let n = 1; n <= items.length; n++) {
          const subset = items.slice(0, n);
          const max = subset.reduce((sum, p) => sum + (p.maxSize ?? Infinity), 0);
          // A lone capped pane constrains its container until the other panes arrive.
          layoutPanes(subset, Math.min(600, max) + 4, 4);
        }
      } else layoutPanes(items, 604, 4);
      items.forEach((p, i) => expect(p.size).toBeCloseTo(expected[i], 8));
    });
  }

  it('excludes hidden panes and keeps their stored size', () => {
    const items = panes([{}, { visible: false, size: 123, preferredSize: 0.9 }]);
    layoutPanes(items, 600);
    expect(items.map(p => p.size)).toEqual([600, 123]);
  });

  it('reports infeasible constraints and handles an empty layout', () => {
    expect(() => layoutPanes(panes([{}, {}]), 100)).toThrow(/enough space/i);
    expect(() => layoutPanes(panes([{ maxSize: 200 }]), 300)).toThrow(/Maximum/);
    expect(layoutPanes([], 0)).toEqual({ minSize: undefined, maxSize: undefined });
  });

  it('resizes adjacent panes and reports a drag blocked by constraints', () => {
    const items = panes([{}, {}]);
    layoutPanes(items, 600);
    const result = resizePanes(items, 1, 50, 600);
    expect(result.initial.map(p => p.current)).toEqual([300, 300]);
    expect(result.changed.map(p => p.current)).toEqual([350, 250]);
    expect(result.constrained).toBe(false);
    expect(resizePanes(items, 1, 1000, 600).constrained).toBe(true);
    expect(items.map(p => p.size)).toEqual([500, 100]);
  });

  it('preserves available space and limits across generated layouts and drags', () => {
    fc.assert(fc.property(
      fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 8 }),
      fc.integer({ min: -2000, max: 2000 }),
      (weights, delta) => {
        const total = weights.reduce((a, b) => a + b, 0);
        const items = panes(weights.map(w => ({ preferredSize: w / total, minSize: 10 })));
        layoutPanes(items, 1000);
        if (items.length > 1) resizePanes(items, 1, delta, 1000);
        expect(items.reduce((sum, p) => sum + (p.size ?? NaN), 0)).toBeCloseTo(1000, 7);
        items.forEach(p => expect(p.size).toBeGreaterThanOrEqual(10 - 1e-8));
      },
    ), { seed: 20260928, numRuns: 200 });
  });

  it('finishes a constrained drag with recurring fractional pane sizes', () => {
    const items = panes([{}, {}, {}].map(() => ({ preferredSize: 1 / 3, minSize: 10 })));
    layoutPanes(items, 1000);
    expect(resizePanes(items, 1, 836, 1000).constrained).toBe(true);
    expect(items.map(p => p.size)).toEqual([980, 10, 10]);
  });

  it('clamps individual preferred sizes even when their total already fits', () => {
    const items = panes([1, 69, 1, 30].map(w => ({ preferredSize: w / 101, minSize: 10 })));
    layoutPanes(items, 1000);
    expect(items[0].size).toBe(10);
    expect(items[2].size).toBe(10);
    expect(items.reduce((sum, item) => sum + item.size!, 0)).toBeCloseTo(1000, 8);
  });
});
