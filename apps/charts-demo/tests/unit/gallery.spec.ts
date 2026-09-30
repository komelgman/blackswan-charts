import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import type { CandlestickPlot, HLine, Line, VLine } from 'blackswan-charts';
import panes from '@demo/gallery/examples/panes';
import shared from '@demo/gallery/examples/shared';
import streaming from '@demo/gallery/examples/streaming';
import { marketBar, time } from '@demo/gallery/data';
import type { ExampleScene } from '@demo/gallery/scene';

describe('gallery scenes without a browser', () => {
  let scope: EffectScope;
  let scene: ExampleScene;
  beforeEach(() => { vi.useFakeTimers(); scope = effectScope(); });
  afterEach(() => {
    scene?.dispose?.();
    scene?.chart.panes.forEach(pane => pane.model.priceReference.stop());
    scope.stop();
    vi.useRealTimers();
  });
  async function create(factory: () => ExampleScene) {
    scene = scope.run(factory)!;
    await nextTick();
    return scene.chart;
  }
  function action(label: string) {
    const found = scene.actions?.find(item => item.label === label);
    expect(found, label).toBeDefined();
    found!.run();
  }

  for (const factory of [panes, shared]) {
    it(`uses different markets in ${factory === panes ? 'panes' : 'shared drawings'}`, async () => {
      const chart = await create(factory);
      const data = chart.panes.map(pane => pane.model.dataSource.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!);
      expect(data[0].loaded).toEqual(data[1].loaded);
      expect(data[0].values[119][3]).toBeGreaterThan(data[0].values[0][3]);
      expect(data[1].values[119][3]).toBeLessThan(data[1].values[0][3]);
    });
  }

  it('shares all three drawing types while same-ID local drawings stay independent', async () => {
    const chart = await create(shared);
    const main = chart.paneModel('main').dataSource;
    const other = chart.paneModel('comparison').dataSource;
    const initialLocal = other.get<VLine>('VLine2').descriptor.options.data.def;
    main.beginTransaction();
    main.update('HLine1', { data: { def: 130 } });
    main.update('VLine1', { data: { def: time(75) } });
    main.update('Line1', { data: { def: [time(25), 105, time(100), 145] } });
    main.update('VLine2', { data: { def: time(35) } });
    main.endTransaction();
    expect(other.get<HLine>(['main', 'HLine1']).descriptor.options.data.def).toBe(130);
    expect(other.get<VLine>(['main', 'VLine1']).descriptor.options.data.def).toBe(time(75));
    expect(other.get<Line>(['main', 'Line1']).descriptor.options.data.def).toEqual([time(25), 105, time(100), 145]);
    expect(other.get<VLine>('VLine2').descriptor.options.data.def).toBe(initialLocal);
    chart.undo();
    expect(other.get<HLine>(['main', 'HLine1']).descriptor.options.data.def).toBe(125);
    expect(other.get<VLine>(['main', 'VLine1']).descriptor.options.data.def).toBe(time(68));
  });

  it('appends candle and volume bars without adding feed updates to undo history', async () => {
    const chart = await create(streaming);
    const source = chart.paneModel('main').dataSource;
    scene.start!();
    await vi.advanceTimersByTimeAsync(2000);
    for (const id of ['OHLCv1', 'OHLCv2']) {
      const content = source.get<CandlestickPlot>(id).descriptor.options.data.content!;
      expect(content.values).toHaveLength(82);
      expect(content.values[81]).toEqual(marketBar(81));
      expect(content.loaded.to).toBe(time(82));
    }
    expect(chart.isCanUndo).toBe(false);
    action('Pause feed');
    await vi.advanceTimersByTimeAsync(5000);
    expect(scene.status).toContain('82 bars received · Paused');
    action('Add one bar');
    expect(scene.status).toContain('83 bars received');
    expect(chart.isCanUndo).toBe(false);
    action('Resume feed');
    await vi.advanceTimersByTimeAsync(1000);
    expect(scene.status).toContain('84 bars received');
    scene.dispose!();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can stop following and bounds retained data during a long feed', async () => {
    const chart = await create(streaming);
    action('Follow: on');
    const initialRange = { ...chart.timeAxis.range };
    scene.start!();
    await vi.advanceTimersByTimeAsync(200000);
    const data = chart.paneModel('main').dataSource.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!;
    expect(data.values).toHaveLength(240);
    expect(data.loaded).toEqual({ from: time(40), to: time(280) });
    expect(chart.timeAxis.range).toEqual(initialRange);
    action('Follow: off');
    expect(chart.timeAxis.range.to).toBe(time(285));
    expect(chart.isCanUndo).toBe(false);
  });
});
