import { describe, expect, it } from 'vitest';
import { createChartHarness } from '@tests/support/chartHarness';
import { TimePeriods } from '@/model/chart/types/time';
import { LineBound, type Line, type OHLCv, type OHLCvPlot, type OHLCvPlotOptions, type Price, type UTCTimestamp } from '@/model/chart/types';
import { PriceAxisContextMenu } from '@/model/chart/user-interactions/context-menu/PriceAxisContextMenu';
import { ChartSerializer } from '@/model/chart/serialization/ChartSerializer';
import { ChartDeserializer } from '@/model/chart/serialization/ChartDesializer';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';

const hour = 3600000;
const timeRange = (from: number, to: number) => ({ from: from as UTCTimestamp, to: to as UTCTimestamp });
const content = (): OHLCv => ({ loaded: timeRange(0, 3 * hour), available: timeRange(0, 3 * hour), step: TimePeriods.h1,
  values: ([100, 200, 50] as Price[]).map(value => [value, value, value, value]) });

describe('percentage and registered price scales', () => {
  it('derives the base from the first visible close, including data updates, undo and pane reattachment', async () => {
    const h = createChartHarness({ render: false });
    try {
      const ds = h.addPane('main', undefined, [{ id: 'OHLCv1', type: 'OHLCv', visible: true, locked: true,
        data: { content: content(), plotOptions: { type: 'CandlestickPlot' } } }]);
      const axis = h.chart.paneModel('main').priceAxis;
      h.addPane('second');
      axis.noHistoryManagedUpdate({ primaryEntryRef: { ds, entryRef: 'OHLCv1' }, range: { from: 80 as Price, to: 140 as Price } });
      h.chart.timeAxis.range = timeRange(0, 2 * hour);
      await h.settle(); h.chart.clearHistory();
      const position = axis.translate(110 as Price);
      axis.scale = 'percentage'; await h.settle();
      expect(axis.referencePrice.value).toBe(100);
      expect(axis.formatPrice(110 as Price, 1)).toBe('+10%');
      expect(axis.translate(110 as Price)).toBe(position);
      const originalData = structuredClone(ds.get<OHLCvPlot<OHLCvPlotOptions>>('OHLCv1').descriptor.options.data.content);
      h.chart.timeAxis.range = timeRange(hour + 1, 3 * hour); await h.settle();
      expect(axis.referencePrice.value).toBe(200);
      expect(axis.formatPrice(110 as Price, 2)).toBe('-45%');
      expect(ds.get<OHLCvPlot<OHLCvPlotOptions>>('OHLCv1').descriptor.options.data.content).toEqual(originalData);
      h.chart.undo(); await h.settle(); expect(axis.referencePrice.value).toBe(100);
      h.chart.undo(); await h.settle(); expect(axis.scale.id).toBe('regular');
      h.chart.redo(); await h.settle(); expect(axis.scale.id).toBe('percentage');
      h.transact(ds, () => ds.update('OHLCv1', { data: { content: { ...content(), values: [[50, 50, 50, 50]] } } }));
      await h.settle(); expect(axis.referencePrice.value).toBe(50);
      h.chart.undo(); await h.settle(); expect(axis.referencePrice.value).toBe(100);
      h.chart.removePane('main'); await h.settle(); h.chart.undo(); await h.settle();
      h.chart.timeAxis.range = timeRange(2 * hour, 3 * hour); await h.settle(); expect(axis.referencePrice.value).toBe(50);
      h.chart.timeAxis.range = timeRange(4 * hour, 5 * hour); await h.settle();
      expect(axis.referencePrice.value).toBeUndefined();
      expect(axis.tickValues(10)).toEqual([]);
      expect(axis.formatPrice(100 as Price)).toBe('—');
    } finally { h.dispose(); }
  });

  it('adds a per-chart scale without modifying the menu or axis implementation; ID survives JSON and history', async () => {
    const custom = { id: 'custom', title: 'Custom', func: { translate: (price: Price) => price * 2, revert: (value: number) => value / 2 as Price },
      ticks: () => [0, 1] as Price[], format: (value: Price) => `value=${value}` };
    const h = createChartHarness({ render: false, priceScales: { custom } });
    try {
      h.addPane('main'); await h.settle(); h.chart.clearHistory();
      const axis = h.chart.paneModel('main').priceAxis;
      const menu = new PriceAxisContextMenu(axis).contextmenu();
      expect(menu.some(item => 'title' in item && item.title === 'Scale - Custom')).toBe(true);
      axis.scale = 'custom';
      expect(axis.tickValues(5)).toEqual([0, 1]);
      expect(axis.formatPrice(1 as Price)).toBe('value=1');
      expect(axis.revert(axis.translate(0.25 as Price))).toBeCloseTo(0.25, 12);
      h.chart.undo(); expect(axis.scale.id).toBe('regular');
      expect(axis.formatPrice(1 as Price)).not.toContain('value=');
      h.chart.redo(); expect(axis.scale.id).toBe('custom');
      const ds = h.chart.paneModel('main').dataSource;
      h.transact(ds, () => ds.add({ id: 'Line1', type: 'Line', locked: false, visible: true,
        data: { def: [-0.5, 0, 0.5, 1], scale: custom, boundType: LineBound.Both, style: { color: '#123', lineWidth: 1, fill: 0 } } }));
      const serialized = JSON.parse(JSON.stringify(new ChartSerializer().serialize(h.chart)));
      new ChartDeserializer().deserialize(h.chart, serialized); await h.settle();
      expect(h.chart.paneModel('main').priceAxis.scale.id).toBe('custom');
      expect(h.chart.paneModel('main').priceAxis.formatPrice(1 as Price)).toBe('value=1');
      expect(h.chart.paneModel('main').dataSource.get<Line>('Line1').descriptor.options.data.scale.func.translate(2 as Price)).toBe(4);
      expect(PriceScales.custom).toBeUndefined();
      h.chart.clearHistory();
      expect(() => { h.chart.paneModel('main').priceAxis.scale = 'missing'; }).toThrow('Unknown price scale');
      expect(h.chart.isCanUndo).toBe(false);
    } finally { h.dispose(); }
  });
});
