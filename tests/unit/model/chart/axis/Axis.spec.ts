import { nextTick, watch } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PriceAxis, type PriceAxisOptions } from '@/model/chart/axis/PriceAxis';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@/model/misc/tools';
import DataSource from '@/model/datasource/DataSource';
import defaultChartStyle from '@/model/default-config/ChartStyle.Defaults';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';
import type Axis from '@/model/chart/axis/Axis';
import { ControlMode } from '@/model/chart/axis/types';
import type { DrawingOptions } from '@/model/datasource/types';
import { clone } from '@/model/misc/object.clone';

describe('Axis', () => {
  const preferred = {
    priceAxis: { from: 1, to: 20 } as Range<Price>,
    timeAxis: { from: 1000, to: 2000 } as Range<UTCTimestamp>,
  };

  const drawing1: DrawingOptions = {
    id: 'test1',
    data: '',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  let axis: Axis<Price, PriceAxisOptions>;
  let ds: DataSource;
  let history: History;

  beforeEach(() => {
    const idHelper = new IdHelper();
    history = new History();
    const transactionManager = new HistoricalTransactionManager(idHelper, history);

    ds = new DataSource({ id: 'main', idHelper });
    ds.transactionManager = transactionManager;
    axis = new PriceAxis('price', transactionManager, defaultChartStyle.text, 0);
  });

  it('.controlMode should be changed to AUTO when axis.primaryEntryRef changed', async () => {
    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);

    axis.primaryEntryRef = { ds, entryRef: 'test' };

    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
  });

  it('.controlMode should be changed to AUTO when axis.primaryEntryRef changed in one transaction', async () => {
    axis.primaryEntryRef = { ds, entryRef: 'test' };
    // imitate automatic range changing
    axis.noHistoryManagedUpdate({
      range: { from: -100 as Price, to: 100 as Price },
    });

    expect(axis.primaryEntryRef).toEqual({ value: { ds, entryRef: 'test' } });
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
    expect(axis.range).toEqual({ from: -100, to: 100 });

    history.undo();

    expect(axis.primaryEntryRef).toEqual({ value: undefined });
    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);
    expect(axis.range).toEqual({ from: -1, to: 1 });

    history.redo();

    expect(axis.primaryEntryRef).toEqual({ value: { ds, entryRef: 'test' } });
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);

    // sic: no history changes in automatic manipulations,
    // theses changes should be reasigned by external automatic algorithm
    expect(axis.range).toEqual({ from: -1, to: 1 });
  });

  it('.preferredRange should be reactive', async () => {
    ds.beginTransaction();
    ds.add(drawing1);
    ds.endTransaction();
    const spy = vi.fn();
     
    watch(axis['preferredRange'], spy);

    // check that initial value setted
    const entry = ds.get(drawing1.id);
    entry.drawing = { handles: {}, parts: [], preferred: clone(preferred) };
    ds.invalidated([entry]);
    axis.primaryEntryRef = { ds, entryRef: entry.descriptor.ref };
    await nextTick();

    expect(spy).toHaveBeenCalled();
    expect(axis.range).toEqual({ from: 1, to: 20 });

    // check that update work as expected
    const tmp = { timeAxis: { from: 1000, to: 3000 } as Range<UTCTimestamp>, priceAxis: { from: 2, to: 3 } as Range<Price> };
    entry.drawing = { handles: {}, parts: [], preferred: tmp };
    ds.invalidated([entry]);
    await nextTick();

    expect(spy).toHaveBeenCalled();
    expect(axis.range).toEqual({ from: 2, to: 3 });
  });

  it('.preferredRange should be reactive and axis.range === prefferedRange after entryRef assigned', async () => {
    ds.beginTransaction();
    ds.add(drawing1);
    ds.endTransaction();

    const spy = vi.fn();
     
    watch(axis['preferredRange'], spy);

    const entry = ds.get(drawing1.id);
    entry.drawing = { handles: {}, parts: [], preferred };
    ds.invalidated([entry]);

    axis.primaryEntryRef = { ds, entryRef: entry.descriptor.ref };

    await nextTick();

    expect(spy).toHaveBeenCalled();
    expect(axis.range).toEqual({ from: 1, to: 20 });
  });

  it('.controlMode should be changed to MANUAL when axis.primaryEntryRef set to undefined', async () => {
    axis.controlMode = ControlMode.AUTO;
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);

    axis.primaryEntryRef = undefined;

    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);
  });

  it('.controlMode===LOCKED should\'t be changed when axis.primaryEntryRef changed', async () => {
    axis.controlMode = ControlMode.LOCKED;

    axis.primaryEntryRef = { ds, entryRef: 'test' };

    expect(axis.controlMode.value).toBe(ControlMode.LOCKED);
  });

  it('.controlMode===AUTO shouldt be changed to MANUAL when manual move', async () => {
    axis.controlMode = ControlMode.AUTO;

    axis.move(1);

    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);
  });

  it('.controlMode===LOCKED should\'t be changed when try to manual move', async () => {
    axis.controlMode = ControlMode.LOCKED;

    axis.move(1);

    expect(axis.controlMode.value).toBe(ControlMode.LOCKED);
  });

  it('.controlMode===AUTO shouldt be changed to MANUAL when manual zoom', async () => {
    axis.controlMode = ControlMode.AUTO;

    axis.zoom(0, 1);

    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);
  });

  it('.controlMode===LOCKED should\'t be changed when try to manual zoom', async () => {
    axis.controlMode = ControlMode.LOCKED;

    axis.zoom(0, 1);

    expect(axis.controlMode.value).toBe(ControlMode.LOCKED);
  });

  it('.controlMode should be reactive', () => {
    const spy = vi.fn();

    expect(axis.controlMode.value).toEqual(ControlMode.MANUAL);

    watch(axis.controlMode, (a) => spy(a), { flush: 'sync' });
    axis.controlMode = ControlMode.AUTO;

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, { value: ControlMode.AUTO });
  });

  it('.range should be reactive', () => {
    const spy = vi.fn();

    watch(axis.range, spy, { flush: 'sync' });
    axis.move(2);

    expect(spy).toHaveBeenCalled();
  });

  it('.labels should be reactive', () => {
    const spy = vi.fn();

    watch(axis.labels, spy, { flush: 'sync' });
    axis.noHistoryManagedUpdate({ labels: [[0, '0 usd']] });

    expect(spy).toHaveBeenCalled();
  });

  it('.primaryEntryRef should be reactive', () => {
    const spy = vi.fn();

    watch(axis.primaryEntryRef, spy, { flush: 'sync' });
    axis.primaryEntryRef = { ds, entryRef: 'test' };

    expect(spy).toHaveBeenCalled();
  });

  it('.screenSize should be reactive', () => {
    const spy = vi.fn();

    watch(axis.screenSize, spy, { flush: 'sync' });
    axis.noHistoryManagedUpdate({ screenSize: { main: 100, second: 100 } });

    expect(spy).toHaveBeenCalled();
  });

  it('.textStyle should be reactive', () => {
    const spy = vi.fn();

    watch(axis.textStyle, spy, { flush: 'sync' });
    axis.noHistoryManagedUpdate({ textStyle: { fontSize: 100, color: 'aaaaaa', fontFamily: 'Verdana' } });

    expect(spy).toHaveBeenCalled();
  });
});
