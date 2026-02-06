import { beforeEach, describe, expect, it } from 'vitest';
import type { PaneOptions } from '@blackswan/layout/model';
import { ControlMode } from '@/model/chart/axis/types';
import { Chart } from '@/model/chart/Chart';
import { ChartDeserializer } from '@/model/chart/serialization/ChartDesializer';
import type { SerializedTimeAxis } from '@/model/chart/serialization/types';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';
import { Themes, type ChartTheme } from '@/model/chart/types/styles';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/types';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import { clone, merge, IdHelper } from 'blackswan-foundation';

describe('ChartDeserializer', () => {
  const drawing1: DrawingOptions = {
    id: 'test1',
    data: '',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  const paneOptions: PaneOptions<ViewportOptions> = {
    maxSize: 300,
    minSize: 100,
    preferredSize: 0.4,
    visible: true,
    priceAxis: {
      inverted: true,
      scale: 'regular',
      primaryEntry: 'someref',
      range: { from: -10, to: 10 } as Range<Price>,
      controlMode: ControlMode.AUTO,
      priority: 3,
    },
  };

  let ds: DataSource;
  let chart: Chart;
  let deserializer: ChartDeserializer;
  let timeAxisData: SerializedTimeAxis;

  beforeEach(() => {
    const idHelper = new IdHelper();
    ds = new DataSource({ id: 'main', idHelper }, [clone(drawing1)]);

    chart = new Chart(idHelper, { theme: Themes.DARK });
    chart.createPane(ds);
    deserializer = new ChartDeserializer();
    timeAxisData = {
      controlMode: ControlMode.AUTO,
      justfollow: true,
      range: { from: -1000, to: 1000 } as Range<UTCTimestamp>,
      primaryEntry: {},
    };
  });

  it('chart style should be updated and restored on undo', async () => {
    expect(chart.style).toEqual(darkTheme);

    const newTheme = merge({}, { ...darkTheme }, { backgroundColor: '#000000', theme: Themes.CUSTOM })[0] as ChartTheme;
    deserializer.deserialize(chart, { theme: newTheme, panes: [], timeAxis: clone(timeAxisData) });

    expect(chart.style).toEqual(newTheme);
    expect(chart.style.backgroundColor).toBe('#000000');
    expect(chart.style.theme).toBe(Themes.CUSTOM);

    chart.undo();

    expect(chart.style).toEqual(darkTheme);
  });

  it('chart style should be updated and restored on undo', async () => {
    expect(chart.style).toEqual(darkTheme);

    deserializer.deserialize(chart, { theme: Themes.LIGHT, panes: [], timeAxis: clone(timeAxisData) });

    expect(chart.style.theme).toBe(Themes.LIGHT);

    chart.undo();

    expect(chart.style).toEqual(darkTheme);
  });

  it('.panes, exists panes should be removed, and restored on undo', async () => {
    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe(ds.id);

    deserializer.deserialize(chart, { theme: Themes.SYSTEM, panes: [], timeAxis: clone(timeAxisData) });

    expect(chart.panes.length).toBe(0);

    chart.undo();
    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe(ds.id);
  });

  it('.panes, new panes should be presented, and prev state should be restored on undo', async () => {
    deserializer.deserialize(chart, {
      theme: Themes.SYSTEM,
      panes: [{ paneOptions: clone(paneOptions), dataSource: { id: 'main', drawings: [] } }],
      timeAxis: clone(timeAxisData),
    });

    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe('main');
    expect(chart.panes[0].model.priceAxis.range).toEqual({ from: -10, to: 10 });
    expect(chart.panes[0].model.priceAxis.controlMode.value).toBe(ControlMode.AUTO);
    expect(chart.panes[0].model.priceAxis.inverted.value).toBe(1);
    expect(chart.panes[0].model.priceAxis.primaryEntryRef.value?.ds.id).toBe('main');
    expect(chart.panes[0].model.priceAxis.primaryEntryRef.value?.entryRef).toBe('someref');
    expect(chart.panes[0].model.priceAxis.priority).toBe(3);

    chart.undo();
    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe(ds.id);
    expect(chart.panes[0].model.priceAxis.range).toEqual({ from: -1, to: 1 });
    expect(chart.panes[0].model.priceAxis.controlMode.value).toBe('manual');
    expect(chart.panes[0].model.priceAxis.inverted.value).toBe(-1);
    expect(chart.panes[0].model.priceAxis.primaryEntryRef.value?.ds.id).toBeUndefined();
    expect(chart.panes[0].model.priceAxis.primaryEntryRef.value?.entryRef).toBeUndefined();
    expect(chart.panes[0].model.priceAxis.priority).toBe(Number.MIN_VALUE);
  });

  it('.timeAxis should be updated and restored on undo', async () => {
    expect(chart.timeAxis.range).toEqual({ from: -1, to: 1 });
    expect(chart.timeAxis.controlMode.value).toEqual(ControlMode.MANUAL);
    expect(chart.timeAxis.isJustFollow()).toEqual(false);

    deserializer.deserialize(chart, {
      theme: Themes.SYSTEM,
      panes: [{ paneOptions: clone(paneOptions), dataSource: { id: 'main', drawings: [] } }],
      timeAxis: { ...clone(timeAxisData), primaryEntry: { dataSourceId: 'main', entryRef: 'someref' } },
    });

    expect(chart.timeAxis.range).toEqual({ from: -1000, to: 1000 });
    expect(chart.timeAxis.controlMode.value).toEqual(ControlMode.AUTO);
    expect(chart.timeAxis.isJustFollow()).toEqual(true);
    expect(chart.timeAxis.primaryEntryRef.value?.ds.id).toEqual('main');
    expect(chart.timeAxis.primaryEntryRef.value?.entryRef).toEqual('someref');
  });
});
