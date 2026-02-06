import { beforeEach, describe, expect, it } from 'vitest';
import { clone, IdHelper } from 'blackswan-foundation';
import DataSource from '@/model/datasource/DataSource';
import type { DataSourceEntry, DrawingOptions, DrawingReference } from '@/model/datasource/types';
import { HistoricalTransactionManager, History } from '@/model/history';

describe('DataSourceSharedEntries', () => {
  let ds1: DataSource;
  let ds2: DataSource;
  let idHelper: IdHelper;

  const drawing0: DrawingOptions = {
    id: 'test0',
    data: 'test entry0',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  const drawing1: DrawingOptions = {
    id: 'test1',
    data: 'test entry1',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  const drawing2: DrawingOptions = {
    id: 'test2',
    data: 'test entry2',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  const drawing3: DrawingOptions = {
    id: 'test3',
    data: 'test entry3',
    type: 'test',
    locked: false,
    visible: false,
    shareWith: ['ds1'],
  };

  const drawing4: DrawingOptions = {
    id: 'test4',
    data: 'test entry4',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: ['ds3'],
  };

  function getDrawingReferencesFromIterator(ii: IterableIterator<Readonly<DataSourceEntry>>): DrawingReference[] {
    const result: DrawingReference[] = [];
    for (const item of ii) {
      result.push(item.descriptor.ref);
    }
    return result;
  }

  beforeEach(async () => {
    idHelper = new IdHelper();
    ds1 = new DataSource({ id: 'ds1', idHelper }, clone([drawing0, drawing1, drawing2]));
    ds2 = new DataSource({ id: 'ds2', idHelper }, clone([drawing2, drawing3, drawing4]));
  });

  it('test shared() iterator', () => {
    const drawingReferencesFromIterator: DrawingReference[] = getDrawingReferencesFromIterator(ds2.sharedEntries.sharedWith('ds1'));
    expect(drawingReferencesFromIterator).toEqual([drawing2.id, drawing3.id]);
  });

  it('test attach/detach shared entries to filled data source', () => {
    ds1.sharedEntries.attachSharedEntriesFrom(ds2);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([[ds2.id, drawing2.id], [ds2.id, drawing3.id], drawing0.id, drawing1.id, drawing2.id]);

     
    const storage = ds1['storage'];
    expect(storage.head?.value.descriptor.ref).toEqual([ds2.id, drawing2.id]);
    expect(storage.tail?.value.descriptor.ref).toEqual(drawing2.id);

    ds1.sharedEntries.detachSharedEntries(ds2.id);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([drawing0.id, drawing1.id, drawing2.id]);
    expect(storage.head?.value.descriptor.ref).toEqual(drawing0.id);
    expect(storage.tail?.value.descriptor.ref).toEqual(drawing2.id);
  });

  it('test reset data source with shared entries', () => {
    const history: History = new History();
    ds1.transactionManager = new HistoricalTransactionManager(idHelper, history);
    ds1.sharedEntries.attachSharedEntriesFrom(ds2);

    ds1.beginTransaction();
    ds1.reset();
    ds1.endTransaction();

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([[ds2.id, drawing2.id], [ds2.id, drawing3.id]]);

    history.undo();

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([[ds2.id, drawing2.id], [ds2.id, drawing3.id], drawing0.id, drawing1.id, drawing2.id]);

     
    const storage = ds1['storage'];
    expect(storage.head?.value.descriptor.ref).toEqual([ds2.id, drawing2.id]);
    expect(storage.tail?.value.descriptor.ref).toEqual(drawing2.id);
  });

  it('test attach/detach shared entries to empty data source', () => {
    const ds3 = new DataSource({ id: 'ds3', idHelper });
     
    const storage = ds3['storage'];
    ds3.sharedEntries.attachSharedEntriesFrom(ds2);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([[ds2.id, drawing2.id], [ds2.id, drawing4.id]]);
    expect(storage.head?.value.descriptor.ref).toEqual([ds2.id, drawing2.id]);
    expect(storage.tail?.value.descriptor.ref).toEqual([ds2.id, drawing4.id]);

    ds3.sharedEntries.detachSharedEntries(ds2.id);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([]);
    expect(storage.head?.value.descriptor.ref).toBeUndefined();
    expect(storage.tail?.value.descriptor.ref).toBeUndefined();
  });
});
