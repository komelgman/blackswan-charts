import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { ControlMode, type CandlestickPlot, type Price } from 'blackswan-charts';
import percentage from '@demo/gallery/examples/percentage';
import { HOUR, time } from '@demo/gallery/data';
import type { ExampleScene } from '@demo/gallery/types';

describe('percentage comparison example', () => {
  let scope: EffectScope;
  let scene: ExampleScene;
  beforeEach(() => {
    // OHLC cache construction needs paths; no canvas is rendered in these tests.
    vi.stubGlobal('Path2D', class { moveTo() {} lineTo() {} });
    scope = effectScope();
    scene = scope.run(percentage)!;
  });
  afterEach(() => {
    scene.chart.panes.forEach(pane => pane.model.priceReference.stop());
    scope.stop();
    vi.unstubAllGlobals();
  });

  async function settleRanges() {
    const chart = scene.chart;
    chart.timeAxis.noHistoryManagedUpdate({ screenSize: { main: 800, second: 30 } });
    chart.panes.forEach(pane => pane.model.priceAxis.noHistoryManagedUpdate({ screenSize: { main: 150, second: 70 } }));
    for (let pass = 0; pass < 3; pass++) {
      for (const pane of chart.panes) {
        const viewport = pane.model;
        const entries = Array.from(viewport.dataSource);
        entries.forEach(entry => viewport.getSketcher(entry.descriptor.options.type).invalidate(entry, viewport.projection));
        viewport.dataSource.invalidated(entries);
      }
      await nextTick();
    }
  }
  function series() {
    const source = scene.chart.paneModel('main').dataSource;
    return ['OHLCv1', 'OHLCv2', 'OHLCv3'].map(id => source.get<CandlestickPlot>(id).descriptor.options.data.content!);
  }
  function firstVisibleIndex() {
    return Math.max(0, Math.floor((scene.chart.timeAxis.range.from - time(0)) / HOUR));
  }

  it('displays three independent price series in one viewport using the primary first visible close as zero', async () => {
    await settleRanges();
    const chart = scene.chart;
    const content = series();
    expect(chart.panes).toHaveLength(1);
    const viewport = chart.paneModel('main');
    expect(Array.from(viewport.dataSource).map(entry => entry.descriptor.ref)).toEqual(['OHLCv1', 'OHLCv2', 'OHLCv3']);
    expect(new Set(content).size).toBe(3);
    expect(new Set(content.map(data => data.values)).size).toBe(3);
    expect(content[0].values).not.toEqual(content[1].values);
    expect(content[0].values).not.toEqual(content[2].values);
    const index = firstVisibleIndex();
    const primaryClose = content[0].values[index][3];
    const axis = viewport.priceAxis;
    expect(axis.referencePrice.value).toBe(primaryClose);
    expect(axis.primaryEntryRef.value?.ds).toBe(viewport.dataSource);
    expect(axis.primaryEntryRef.value?.entryRef).toBe('OHLCv1');
    expect(axis.scale.id).toBe('percentage');
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
    expect(axis.formatPrice(primaryClose, 1)).toBe('0%');
    for (let seriesIndex = 1; seriesIndex < content.length; seriesIndex++) {
      const ownClose = content[seriesIndex].values[index][3];
      expect(axis.referencePrice.value).not.toBe(ownClose);
      expect(axis.formatPrice(ownClose, 0.01)).not.toBe('0%');
    }
    expect(scene.status).toBe(`0% = ${primaryClose.toFixed(2)} · primary first visible close`);
    expect(chart.isCanUndo).toBe(false);
  });

  it('updates the common reference when panning and restores it with undo and redo without rewriting prices', async () => {
    await settleRanges();
    const chart = scene.chart;
    const initialRange = { ...chart.timeAxis.range };
    const axis = chart.paneModel('main').priceAxis;
    const initialReference = axis.referencePrice.value!;
    const beforeValues = series().map(content => content.values.map(bar => [...bar]));
    chart.timeAxis.move(160);
    await settleRanges();
    const pannedRange = { ...chart.timeAxis.range };
    const pannedClose = series()[0].values[firstVisibleIndex()][3];
    expect(pannedClose).not.toBe(initialReference);
    expect(axis.referencePrice.value).toBe(pannedClose);
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.MANUAL);
    expect(series().map(content => content.values)).toEqual(beforeValues);
    chart.undo();
    await settleRanges();
    expect(chart.timeAxis.range).toEqual(initialRange);
    expect(axis.referencePrice.value).toBe(initialReference);
    chart.redo();
    await settleRanges();
    expect(chart.timeAxis.range).toEqual(pannedRange);
    expect(axis.referencePrice.value).toBe(pannedClose);
    expect(series().map(content => content.values)).toEqual(beforeValues);
    expect(axis.primaryEntryRef.value?.ds.id).toBe('main');
    expect(axis.primaryEntryRef.value?.entryRef).toBe('OHLCv1');
  });

  it('does not allow an independent secondary source to change the common percentage zero', async () => {
    await settleRanges();
    const chart = scene.chart;
    const viewport = chart.paneModel('main');
    const initialBase = viewport.priceAxis.referencePrice.value!;
    const initialPrimary = series()[0].values.map(bar => [...bar]);
    const initialThird = series()[2].values.map(bar => [...bar]);
    viewport.dataSource.noHistoryManagedEntriesProcess<CandlestickPlot>(['OHLCv2'], entry => {
      const content = entry.descriptor.options.data.content!;
      entry.descriptor.options.data.content = {
        ...content,
        values: content.values.map(([open, high, low, close, volume]) => [
          (open + 10) as Price, (high + 10) as Price, (low + 10) as Price, (close + 10) as Price, volume,
        ]),
      };
    });
    await settleRanges();
    expect(viewport.priceAxis.referencePrice.value).toBe(initialBase);
    expect(series()[0].values).toEqual(initialPrimary);
    expect(series()[2].values).toEqual(initialThird);
    expect(chart.isCanUndo).toBe(false);
  });

  it('keeps all three markets inside native AUTO in the full view and during an ordinary pan', async () => {
    await settleRanges();
    const chart = scene.chart;
    const axis = chart.paneModel('main').priceAxis;
    function expectVisiblePricesInsideRange() {
      for (const content of series()) {
        const visible = content.values.slice(firstVisibleIndex());
        expect(axis.range.from).toBeLessThan(Math.min(...visible.map(bar => bar[2])));
        expect(axis.range.to).toBeGreaterThan(Math.max(...visible.map(bar => bar[1])));
      }
    }
    expectVisiblePricesInsideRange();
    chart.timeAxis.move(160);
    await settleRanges();
    expectVisiblePricesInsideRange();
  });
});
