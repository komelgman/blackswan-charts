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
    return scene.chart.panes.map(pane => pane.model.dataSource.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!);
  }
  function referencePrices() {
    return scene.chart.panes.map(pane => pane.model.priceAxis.referencePrice.value);
  }
  function firstVisibleIndex() {
    return Math.max(0, Math.floor((scene.chart.timeAxis.range.from - time(0)) / HOUR));
  }

  it('uses distinct sources and the primary first visible close for every percentage axis', async () => {
    await settleRanges();
    const chart = scene.chart;
    const content = series();
    expect(chart.panes.map(pane => pane.model.dataSource.id)).toEqual(['main', 'comparison', 'third']);
    expect(new Set(chart.panes.map(pane => pane.model.dataSource)).size).toBe(3);
    expect(content[0].values).not.toEqual(content[1].values);
    expect(content[0].values).not.toEqual(content[2].values);
    const index = firstVisibleIndex();
    const primaryClose = content[0].values[index][3];
    expect(referencePrices()).toEqual([primaryClose, primaryClose, primaryClose]);
    for (const pane of chart.panes) {
      const axis = pane.model.priceAxis;
      expect(axis.primaryEntryRef.value?.ds).toBe(chart.paneModel('main').dataSource);
      expect(axis.primaryEntryRef.value?.entryRef).toBe('OHLCv1');
      expect(axis.scale.id).toBe('percentage');
      expect(axis.controlMode.value).toBe(ControlMode.AUTO);
      expect(axis.formatPrice(primaryClose, 1)).toBe('0%');
      expect(axis.range).toEqual(chart.paneModel('main').priceAxis.range);
    }
    for (let paneIndex = 1; paneIndex < chart.panes.length; paneIndex++) {
      const axis = chart.panes[paneIndex].model.priceAxis;
      const ownClose = content[paneIndex].values[index][3];
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
    const initialReference = referencePrices()[0]!;
    const beforeValues = series().map(content => content.values.map(bar => [...bar]));
    chart.timeAxis.move(160);
    await settleRanges();
    const pannedRange = { ...chart.timeAxis.range };
    const pannedClose = series()[0].values[firstVisibleIndex()][3];
    expect(pannedClose).not.toBe(initialReference);
    expect(referencePrices()).toEqual([pannedClose, pannedClose, pannedClose]);
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.MANUAL);
    expect(series().map(content => content.values)).toEqual(beforeValues);
    chart.undo();
    await settleRanges();
    expect(chart.timeAxis.range).toEqual(initialRange);
    expect(referencePrices()).toEqual([initialReference, initialReference, initialReference]);
    chart.redo();
    await settleRanges();
    expect(chart.timeAxis.range).toEqual(pannedRange);
    expect(referencePrices()).toEqual([pannedClose, pannedClose, pannedClose]);
    expect(series().map(content => content.values)).toEqual(beforeValues);
    expect(chart.panes.map(pane => pane.model.priceAxis.primaryEntryRef.value?.ds.id)).toEqual(['main', 'main', 'main']);
  });

  it('does not allow an independent secondary source to change the common percentage zero', async () => {
    await settleRanges();
    const chart = scene.chart;
    const initialBase = referencePrices()[0]!;
    const comparison = chart.paneModel('comparison').dataSource;
    comparison.noHistoryManagedEntriesProcess<CandlestickPlot>(['OHLCv1'], entry => {
      const content = entry.descriptor.options.data.content!;
      entry.descriptor.options.data.content = {
        ...content,
        values: content.values.map(([open, high, low, close, volume]) => [
          (open + 10) as Price, (high + 10) as Price, (low + 10) as Price, (close + 10) as Price, volume,
        ]),
      };
    });
    await settleRanges();
    expect(referencePrices()).toEqual([initialBase, initialBase, initialBase]);
    expect(chart.isCanUndo).toBe(false);
  });
});
