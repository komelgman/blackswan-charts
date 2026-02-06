import { watch } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DataSource from '@/model/datasource/DataSource';
import { IdHelper, clone } from 'blackswan-foundation';
import { History, HistoricalTransactionManager } from '@/model/history';
import type { DataSourceEntry, DrawingOptions } from '@/model/datasource/types';
import { PrimaryEntry } from '@/model/datasource/PrimaryEntry';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';

describe('PrimaryEntry', () => {
  let ds: DataSource;
  let history: History;
  let entry: DataSourceEntry<any>;
  let primaryEntry: PrimaryEntry;

  const drawing1: DrawingOptions = {
    id: 'test1',
    data: '',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  beforeEach(() => {
    const idHelper = new IdHelper();
    history = new History();
    const transactionManager = new HistoricalTransactionManager(idHelper, history);

    ds = new DataSource({ id: 'main', idHelper }, [clone(drawing1)]);
    ds.transactionManager = transactionManager;
    entry = ds.get(drawing1.id);
    primaryEntry = new PrimaryEntry();
  });

  it('.entryRef should be reactive', async () => {
    const spy = vi.fn();
    watch(primaryEntry.entryRef, spy, { flush: 'sync' });

    primaryEntry.entryRef = { ds, entryRef: entry.descriptor.ref };

    expect(spy).toHaveBeenCalled();
  });

  it('.preferredTimeRange should be reactive and changed when entry.drawing.preffered changes', async () => {
    const preferred = { priceAxis: { from: 10, to: 20 } as Range<Price>, timeAxis: { from: 1000, to: 2000 } as Range<UTCTimestamp> };
    const spy = vi.fn();
    watch(primaryEntry.preferredTimeRange, spy, { flush: 'sync' });

    primaryEntry.entryRef = { ds, entryRef: entry.descriptor.ref };
    expect(spy).not.toHaveBeenCalled();

    entry.drawing = { handles: {}, parts: [], preferred };
    ds.invalidated([entry]);

    expect(spy).toHaveBeenCalled();
    expect(primaryEntry.preferredTimeRange.value).toEqual({ from: 1000, to: 2000 });
  });

  it('.preferredPimeRange should be reactive and changed when entry.drawing.preffered changes', async () => {
    const preferred = { priceAxis: { from: 10, to: 20 } as Range<Price>, timeAxis: { from: 1000, to: 2000 } as Range<UTCTimestamp> };
    const spy = vi.fn();
    watch(primaryEntry.preferredPriceRange, spy, { flush: 'sync' });

    primaryEntry.entryRef = { ds, entryRef: entry.descriptor.ref };
    expect(spy).not.toHaveBeenCalled();

    entry.drawing = { handles: {}, parts: [], preferred };
    ds.invalidated([entry]);

    expect(spy).toHaveBeenCalled();
    expect(primaryEntry.preferredPriceRange.value).toEqual({ from: 10, to: 20 });
  });
});
