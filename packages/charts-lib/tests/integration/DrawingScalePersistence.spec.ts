import { describe, expect, it } from 'vitest';
import { createChartHarness } from '@tests/support/chartHarness';
import { ChartSerializer } from '@/model/chart/serialization/ChartSerializer';
import { ChartDeserializer } from '@/model/chart/serialization/ChartDesializer';
import type { HasScale, Price } from '@/model/chart/types';

type ScaledShape = HasScale & { points: number[][]; parameters: { width: number; turns: number } };

const custom = {
  id: 'custom', title: 'Custom',
  func: { translate: (price: Price) => price * 2, revert: (value: number) => value / 2 as Price },
};

describe('scale persistence is independent of drawing type', () => {
  it.each(['Channel', 'Spiral'])('round-trips %s scale by ID and preserves the drawing payload', async type => {
    const h = createChartHarness({ render: false, priceScales: { custom } });
    try {
      const data: ScaledShape = { scale: custom, points: [[0, 10], [1, 20]], parameters: { width: 3, turns: 2 } };
      const ds = h.addPane('main', undefined, [{ id: `${type}1`, type, data, visible: true, locked: false }]);
      await h.settle();
      const serialized = new ChartSerializer().serialize(h.chart);
      expect(serialized.panes[0].dataSource.drawings[0].data).toEqual({ ...data, scale: { id: 'custom' } });
      expect(ds.get<ScaledShape>(`${type}1`).descriptor.options.data.scale.func.translate(5 as Price)).toBe(10);
      new ChartDeserializer().deserialize(h.chart, JSON.parse(JSON.stringify(serialized)));
      await h.settle();
      const restored = h.chart.paneModel('main').dataSource.get<ScaledShape>(`${type}1`).descriptor.options;
      expect(restored.type).toBe(type);
      expect(restored.data.points).toEqual(data.points);
      expect(restored.data.parameters).toEqual(data.parameters);
      expect(restored.data.scale.func.translate(5 as Price)).toBe(10);
    } finally { h.dispose(); }
  });

  it('rejects an unknown scale on a custom drawing before changing the chart or history', async () => {
    const h = createChartHarness({ render: false });
    try {
      h.addPane('main'); await h.settle(); h.chart.clearHistory();
      const serializer = new ChartSerializer();
      const before = serializer.serialize(h.chart);
      const incoming = structuredClone(before);
      incoming.panes[0].dataSource.drawings.push({ id: 'Spiral1', type: 'Spiral', visible: true, locked: false,
        data: { scale: { id: 'missing' }, turns: 3 } });
      expect(() => new ChartDeserializer().deserialize(h.chart, incoming)).toThrow('Unknown price scale: missing');
      expect(serializer.serialize(h.chart)).toEqual(before);
      expect(h.chart.isCanUndo).toBe(false);
    } finally { h.dispose(); }
  });

  it('leaves drawing data without a price-scale reference unchanged', async () => {
    const h = createChartHarness({ render: false });
    try {
      const payloads = [null, 'text', 42, { label: 'note' }, { scale: 2, text: 'annotation size' }];
      h.addPane('main', undefined, payloads.map((data, i) => ({ id: `Annotation${i}`, type: 'Annotation', data,
        visible: true, locked: false })));
      await h.settle();
      const snapshot = new ChartSerializer().serialize(h.chart);
      new ChartDeserializer().deserialize(h.chart, JSON.parse(JSON.stringify(snapshot)));
      await h.settle();
      const restored = new ChartSerializer().serialize(h.chart);
      expect(restored.panes[0].dataSource.drawings.map(drawing => drawing.data)).toEqual(payloads);
    } finally { h.dispose(); }
  });
});
