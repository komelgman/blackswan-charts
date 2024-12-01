import { beforeEach, describe, expect, it } from 'vitest';
import { Chart } from '@/model/chart/Chart';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/types';
import { IdHelper } from '@/model/misc/tools';
import defaultChartSyle from '@/model/default-config/ChartStyle.Defaults';
import { clone } from '@/model/misc/object.clone';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';
import { ControlMode } from '@/model/chart/axis/types';
import { ChartDeserializer } from '@/model/chart/serialization/ChartDesializer';
import { merge } from '@/model/misc/object.merge';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { SerializedTimeAxis } from '@/model/chart/serialization/types';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';
import type { PaneOptions } from '@/components/layout/types';

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
    },
  };

  let ds: DataSource;
  let chart: Chart;
  let deserializer: ChartDeserializer;
  let timeAxisData: SerializedTimeAxis;

  beforeEach(() => {
    const idHelper = new IdHelper();
    ds = new DataSource({ id: 'main', idHelper }, [clone(drawing1)]);

    chart = new Chart(idHelper);
    chart.createPane(ds);
    deserializer = new ChartDeserializer();
    timeAxisData = {
      controlMode: ControlMode.AUTO,
      justfollow: true,
      range: { from: -1000, to: 1000 } as Range<UTCTimestamp>,
      primaryEntry: {},
    };
  });

  it(' chart style should be updated and restored on undo', async () => {
    expect(chart.style).toEqual(defaultChartSyle);

    const newStyle = merge({}, { ...defaultChartSyle }, { backgroundColor: '#000000' })[0] as ChartStyle;
    deserializer.deserialize(chart, { style: newStyle, panes: [], timeAxis: clone(timeAxisData) });

    expect(chart.style).toEqual(newStyle);
    expect(chart.style.backgroundColor).toBe('#000000');

    chart.undo();

    expect(chart.style).toEqual(defaultChartSyle);
  });

  it('.panes, exists panes should be removed, and restored on undo', async () => {
    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe(ds.id);

    deserializer.deserialize(chart, { style: {}, panes: [], timeAxis: clone(timeAxisData) });

    expect(chart.panes.length).toBe(0);

    chart.undo();
    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe(ds.id);
  });

  it('.panes, new panes should be presented, and prev state should be restored on undo', async () => {
    deserializer.deserialize(chart, { style: {},
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

    chart.undo();
    expect(chart.panes.length).toBe(1);
    expect(chart.panes[0].id).toBe(ds.id);
    expect(chart.panes[0].model.priceAxis.range).toEqual({ from: -1, to: 1 });
    expect(chart.panes[0].model.priceAxis.controlMode.value).toBe('manual');
    expect(chart.panes[0].model.priceAxis.inverted.value).toBe(-1);
    expect(chart.panes[0].model.priceAxis.primaryEntryRef.value?.ds.id).toBeUndefined();
    expect(chart.panes[0].model.priceAxis.primaryEntryRef.value?.entryRef).toBeUndefined();
  });

  it('.timeAxis should be updated and restored on undo', async () => {
    expect(chart.timeAxis.range).toEqual({ from: -1, to: 1 });
    expect(chart.timeAxis.controlMode.value).toEqual(ControlMode.MANUAL);
    expect(chart.timeAxis.isJustFollow()).toEqual(false);

    deserializer.deserialize(chart, { style: {},
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
