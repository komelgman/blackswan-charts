import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, type EffectScope } from 'vue';
import { ControlMode, type CandlestickPlot, type HLine, type Line, type Price, type VLine } from 'blackswan-charts';
import panes from '@demo/gallery/examples/panes';
import shared from '@demo/gallery/examples/shared';
import streaming from '@demo/gallery/examples/streaming';
import history from '@demo/gallery/examples/history';
import basic from '@demo/gallery/examples/basic';
import { HOUR, marketBar, time } from '@demo/gallery/data';
import type { ExampleScene } from '@demo/gallery/scene';

describe('gallery scenes without a browser', () => {
  let scope: EffectScope;
  let scene: ExampleScene;
  beforeEach(() => {
    vi.useFakeTimers();
    // Cache construction needs paths; these tests do not render or test canvas hit detection.
    vi.stubGlobal('Path2D', class { moveTo() {} lineTo() {} });
    scope = effectScope();
  });
  afterEach(() => {
    scene?.dispose?.();
    scene?.chart.panes.forEach(pane => pane.model.priceReference.stop());
    scope.stop();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  async function create(factory: () => ExampleScene) {
    scene = scope.run(factory)!;
    await nextTick();
    await settleRanges();
    return scene.chart;
  }
  async function settleRanges() {
    const chart = scene.chart;
    chart.timeAxis.noHistoryManagedUpdate({ screenSize: { main: 800, second: 30 } });
    chart.panes.forEach(pane => pane.model.priceAxis.noHistoryManagedUpdate({ screenSize: { main: 400, second: 60 } }));
    // Build series caches through the public API; AUTO consumes their preferred ranges.
    // Further passes reproject entries after Vue applies the updated time and price ranges.
    for (let pass = 0; pass < 3; pass++) {
      for (const pane of chart.panes) {
        const viewport = pane.model;
        const entries = Array.from(viewport.dataSource).filter(entry => entry.descriptor.options.type === 'OHLCv');
        entries.forEach(entry => viewport.getSketcher(entry.descriptor.options.type).invalidate(entry, viewport.projection));
        viewport.dataSource.invalidated(entries);
      }
      await nextTick();
    }
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

  it('creates the first chart directly with native theme and automatic price fitting', async () => {
    const chart = await create(basic);
    expect(chart.panes).toHaveLength(1);
    expect(chart.paneModel('main').priceAxis.controlMode.value).toBe(ControlMode.AUTO);
    const data = chart.paneModel('main').dataSource.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!;
    const axis = chart.paneModel('main').priceAxis;
    expect(axis.range.from).toBeLessThan(Math.min(...data.values.map(bar => bar[2])));
    expect(axis.range.to).toBeGreaterThan(Math.max(...data.values.map(bar => bar[1])));
    expect(chart.isCanUndo).toBe(false);
  });

  it('groups both level edits into one undo and can restore the saved chart', async () => {
    const chart = await create(history);
    const levels = () => ['HLine1', 'HLine2'].map(id => chart.paneModel('main').dataSource.get<HLine>(id).descriptor.options.data.def);
    expect(levels()).toEqual([120, 135]);
    action('Move levels +5');
    expect(levels()).toEqual([125, 140]);
    chart.undo();
    expect(levels()).toEqual([120, 135]);
    chart.redo();
    expect(levels()).toEqual([125, 140]);
    action('Restore saved chart');
    await nextTick();
    expect(levels()).toEqual([120, 135]);
    chart.undo();
    expect(levels()).toEqual([125, 140]);
  });

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
    const initialSpan = chart.timeAxis.range.to - chart.timeAxis.range.from;
    expect(initialSpan).toBe(100 * HOUR);
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.AUTO);
    expect(chart.timeAxis.isJustFollow()).toBe(true);
    expect(chart.paneModel('main').priceAxis.controlMode.value).toBe(ControlMode.AUTO);
    scene.start!();
    await vi.advanceTimersByTimeAsync(2000);
    await settleRanges();
    for (const id of ['OHLCv1', 'OHLCv2']) {
      const content = source.get<CandlestickPlot>(id).descriptor.options.data.content!;
      expect(content.values).toHaveLength(82);
      expect(content.values[81]).toEqual(marketBar(81));
      expect(content.loaded.to).toBe(time(82));
    }
    expect(chart.timeAxis.range.to).toBe(time(102));
    expect(chart.timeAxis.range.to - chart.timeAxis.range.from).toBe(initialSpan);
    expect(chart.isCanUndo).toBe(false);
    action('Pause feed');
    await vi.advanceTimersByTimeAsync(5000);
    expect(scene.status).toContain('82 bars received · Paused');
    action('Add one bar');
    await settleRanges();
    expect(scene.status).toContain('83 bars received');
    expect(chart.isCanUndo).toBe(false);
    action('Resume feed');
    await vi.advanceTimersByTimeAsync(1000);
    await settleRanges();
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
    await settleRanges();
    const data = chart.paneModel('main').dataSource.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!;
    expect(data.values).toHaveLength(240);
    expect(data.loaded).toEqual({ from: time(40), to: time(280) });
    expect(chart.timeAxis.range).toEqual(initialRange);
    expect(chart.paneModel('main').priceAxis.controlMode.value).toBe(ControlMode.AUTO);
    action('Follow: off');
    await settleRanges();
    expect(chart.timeAxis.range.to).toBe(time(300));
    expect(chart.timeAxis.range.to - chart.timeAxis.range.from).toBe(100 * HOUR);
    expect(chart.isCanUndo).toBe(false);
  });

  it('reflects manual panning in Follow and leaves the explored time window in place', async () => {
    const chart = await create(streaming);
    chart.timeAxis.move(80);
    await settleRanges();
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.MANUAL);
    expect(chart.timeAxis.isJustFollow()).toBe(false);
    expect(scene.actions?.some(item => item.label === 'Follow: off')).toBe(true);
    const exploredRange = { ...chart.timeAxis.range };
    chart.clearHistory();
    action('Add one bar');
    await settleRanges();
    expect(chart.timeAxis.range).toEqual(exploredRange);
    expect(chart.paneModel('main').priceAxis.controlMode.value).toBe(ControlMode.AUTO);
    expect(chart.isCanUndo).toBe(false);
    action('Follow: off');
    await settleRanges();
    expect(chart.timeAxis.range.to).toBe(time(101));
    expect(chart.timeAxis.range.to - chart.timeAxis.range.from).toBe(exploredRange.to - exploredRange.from);
    expect(scene.actions?.some(item => item.label === 'Follow: on')).toBe(true);
    expect(chart.isCanUndo).toBe(false);
  });

  it('keeps the chosen zoom span while following subsequent bars', async () => {
    const chart = await create(streaming);
    const initialSpan = chart.timeAxis.range.to - chart.timeAxis.range.from;
    chart.timeAxis.zoom(chart.timeAxis.screenSize.main, -10);
    await settleRanges();
    const zoomedRange = { ...chart.timeAxis.range };
    const zoomedSpan = zoomedRange.to - zoomedRange.from;
    expect(zoomedSpan).toBeLessThan(initialSpan);
    expect(chart.timeAxis.controlMode.value).toBe(ControlMode.AUTO);
    expect(chart.timeAxis.isJustFollow()).toBe(true);
    chart.clearHistory();
    action('Add one bar');
    await settleRanges();
    expect(chart.timeAxis.range.to).toBe(zoomedRange.to + HOUR);
    expect(chart.timeAxis.range.from).toBe(zoomedRange.from + HOUR);
    expect(chart.timeAxis.range.to - chart.timeAxis.range.from).toBe(zoomedSpan);
    expect(chart.isCanUndo).toBe(false);
  });

  it('automatically fits high visible prices and excludes prices outside the explored window', async () => {
    const chart = await create(streaming);
    const viewport = chart.paneModel('main');
    chart.timeAxis.noHistoryManagedUpdate({ controlMode: ControlMode.MANUAL, range: { from: time(15), to: time(25) } });
    viewport.dataSource.noHistoryManagedEntriesProcess<CandlestickPlot>(['OHLCv1', 'OHLCv2'], entry => {
      const content = entry.descriptor.options.data.content!;
      entry.descriptor.options.data.content = {
        ...content,
        values: content.values.map((bar, index) => index === 20 || index === 60
          ? [bar[0], (index === 20 ? 1_000_000 : 1_000_000_000) as Price, bar[2], bar[3], bar[4]]
          : bar),
      };
    });
    await settleRanges();
    action('Add one bar');
    await settleRanges();
    const axis = viewport.priceAxis;
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
    expect(axis.range.to).toBeGreaterThan(1_000_000);
    expect(axis.range.to).toBeLessThan(2_000_000);
    expect(axis.translate(1_000_000 as Price)).toBeGreaterThan(0);
    expect(axis.translate(1_000_000 as Price)).toBeLessThan(axis.screenSize.main);
    expect(chart.timeAxis.range).toEqual({ from: time(15), to: time(25) });
    expect(chart.isCanUndo).toBe(false);
  });
});
