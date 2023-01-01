/* eslint-disable @typescript-eslint/dot-notation */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clone } from '@/misc/strict-type-checks';
import DataSource from '@/model/datasource/DataSource';

import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingOptions, DrawingReference } from '@/model/datasource/Drawing';
import TimeVarianceAuthority from '../../history/TimeVarianceAuthority';
import IdHelper from '../../tools/IdHelper';
import type { ChangeReasons } from '../DataSourceChangeEventListener';
import DataSourceChangeEventReason from '../DataSourceChangeEventReason';

describe('DataSource', () => {
  let ds: DataSource;
  let storage: DataSourceEntriesStorage;
  const drawing1: DrawingOptions = {
    id: 'test1',
    data: 'test entry1',
    type: 'test',
    locked: false,
    visible: true,
  };

  const drawing2: DrawingOptions = {
    id: 'test2',
    data: 'test entry2',
    type: 'test',
    locked: false,
    visible: true,
  };

  const drawing3: DrawingOptions = {
    id: 'test3',
    data: 'test entry3',
    type: 'test',
    locked: false,
    visible: false,
  };

  function getDrawingReferences(): DrawingReference[] {
    const result: DrawingReference[] = [];
    let item = storage.head;
    while (item !== undefined) {
      result.push(item.value[0].ref);
      item = item.next;
    }

    return result;
  }

  function getDrawingReferencesFromIterator(ii: IterableIterator<Readonly<DataSourceEntry>>): DrawingReference[] {
    const result: DrawingReference[] = [];
    for (const item of ii) {
      result.push(item[0].ref);
    }
    return result;
  }

  function getDSEntry(ref: DrawingReference): Readonly<DataSourceEntry> {
    const filtered: IterableIterator<Readonly<DataSourceEntry>> = ds.filtered((p) => p[0].ref === ref);
    return filtered.next().value;
  }

  beforeEach(async () => {
    ds = new DataSource({ idHelper: new IdHelper() }, clone([drawing1, drawing2, drawing3]));
    storage = ds['storage'];
  });

  it('should contain initial items', () => {
    expect(getDrawingReferences()).toEqual([drawing1.id, drawing2.id, drawing3.id]);
  });

  it('test getNewId()', () => {
    expect(ds.getNewId('test')).toEqual('test4');
    expect(ds.getNewId('sometype')).toEqual('sometype0');
  });

  // todo add test for bad initial id in dataset

  it('test default iterator', () => {
    const references: DrawingReference[] = [];
    for (const dse of ds) {
      references.push(dse[0].ref);
    }

    expect(references).toEqual([drawing1.id, drawing2.id, drawing3.id]);
  });

  it('test visible() iterator', () => {
    function dataSourceChangeEventListener(reasons: ChangeReasons): void {
      const entries: DataSourceEntry[] = [
        ...(reasons.get(DataSourceChangeEventReason.CacheReset) || []),
      ];

      for (const entry of entries) {
        entry[0].visibleInViewport = true;
      }
    }

    ds.addChangeEventListener(dataSourceChangeEventListener);
    ds.resetCache();
    ds.flush();

    expect(getDrawingReferencesFromIterator(ds.visible())).toEqual([drawing1.id, drawing2.id]);
    expect(getDrawingReferencesFromIterator(ds.visible(true))).toEqual([drawing2.id, drawing1.id]);
  });

  it('test filtered() iterator', () => {
    const drawingReferencesFromIterator: DrawingReference[] = getDrawingReferencesFromIterator(ds.filtered((p) => p[0].ref !== drawing3.id));
    expect(drawingReferencesFromIterator).toEqual([drawing1.id, drawing2.id]);
  });

  // it('test shared() iterator', () => {
  //   const ds2: DataSource = new DataSource(clone([
  //     merge({}, drawing1, { shareWith: '*' })[0] as DrawingOptions,
  //     merge({}, drawing2, { shareWith: 'pane1' })[0] as DrawingOptions,
  //     merge({}, drawing3, { shareWith: 'pane3' })[0] as DrawingOptions,
  //   ]));
  //
  //   const drawingReferencesFromIterator: DrawingReference[] = getDrawingReferencesFromIterator(ds2.shared('pane1'));
  //   expect(drawingReferencesFromIterator).toEqual([drawing1.id, drawing2.id]);
  // });

  // it('test attachExternalEntries()/detachExternalEntries()', () => {
  //   const ds2: DataSource = new DataSource(clone([
  //     merge({}, drawing1, { shareWith: '*' })[0] as DrawingOptions,
  //     merge({}, drawing2, { shareWith: 'pane1' })[0] as DrawingOptions,
  //     merge({}, drawing3, { shareWith: 'pane3' })[0] as DrawingOptions,
  //   ]));
  //
  //   ds.attachExternalEntries('pane2', ds2.shared('pane1'));
  //
  //   expect(getDrawingReferencesFromIterator(ds.filtered(() => true)))
  //     .toEqual([['pane2', drawing2.id], ['pane2', drawing1.id], drawing1.id, drawing2.id, drawing3.id]);
  //   expect(storage.head?.value[0].ref).toEqual(['pane2', drawing2.id]);
  //   expect(storage.tail?.value[0].ref).toEqual(drawing3.id);
  //
  //   ds.detachExternalEntries('pane2');
  //
  //   expect(getDrawingReferencesFromIterator(ds.filtered(() => true)))
  //     .toEqual([drawing1.id, drawing2.id, drawing3.id]);
  //   expect(storage.head?.value[0].ref).toEqual(drawing1.id);
  //   expect(storage.tail?.value[0].ref).toEqual(drawing3.id);
  // });

  it('test (add|remove)ChangeEventListener()/resetCache()', () => {
    let entries: DataSourceEntry[] = [];
    const options: any = {
      eventListener: (reasons: ChangeReasons): void => {
        entries = [
          ...(reasons.get(DataSourceChangeEventReason.CacheReset) || []),
        ];
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    expect(listenerSpy).not.toHaveBeenCalled();

    ds.addChangeEventListener(options.eventListener);
    ds.resetCache();

    expect(listenerSpy).toHaveBeenCalledOnce();
    expect(entries.map((e) => e[0].ref)).toEqual([drawing1.id, drawing2.id, drawing3.id]);

    listenerSpy.mockClear();
    ds.removeChangeEventListener(options.eventListener);
    ds.resetCache();

    expect(listenerSpy).not.toHaveBeenCalled();
  });

  it('test invalidated()', () => {
    let entriesWhichWasReset: DataSourceEntry[] = [];
    let entriesWhichWasInvalidated: DataSourceEntry[] = [];
    const options: any = {
      resetEventListener: (reasons: ChangeReasons): void => {
        entriesWhichWasReset = [
          ...(reasons.get(DataSourceChangeEventReason.CacheReset) || []),
        ];
      },
      invalidateEventListener: (reasons: ChangeReasons): void => {
        entriesWhichWasInvalidated = [
          ...(reasons.get(DataSourceChangeEventReason.CacheInvalidated) || []),
        ];
      },
    };

    const listenerSpy = vi.spyOn(options, 'invalidateEventListener');
    ds.addChangeEventListener(options.resetEventListener);
    ds.addChangeEventListener(options.invalidateEventListener);
    ds.resetCache();

    expect(listenerSpy).toHaveBeenCalled();
    expect(entriesWhichWasInvalidated.map((e) => e[0].ref)).toEqual([]);

    listenerSpy.mockClear();
    ds.invalidated(entriesWhichWasReset);

    expect(listenerSpy).toHaveBeenCalled();
    expect(entriesWhichWasInvalidated.map((e) => e[0].ref)).toEqual([drawing1.id, drawing2.id, drawing3.id]);
  });

  it('test (begin|end)Transaction()', () => {
    const tva: TimeVarianceAuthority = new TimeVarianceAuthority();
    ds.tvaClerk = tva.clerk;

    expect(() => ds.endTransaction())
      .toThrowError(/^Invalid state, dataSource.beginTransaction\(\) should be used before$/);
    expect(tva['current'].title).toEqual('big-boom');
    expect(tva['current'].sign).toBeTruthy();

    ds.beginTransaction({ incident: 'test-incident' });

    expect(tva['current'].title).toEqual('test-incident');
    expect(tva['current'].sign).toBeFalsy();

    ds.endTransaction();

    expect(tva['current'].title).toEqual('test-incident');
    expect(tva['current'].sign).toBeTruthy();
  });

  it('test add()/remove() entry', () => {
    const tva: TimeVarianceAuthority = new TimeVarianceAuthority();
    ds.tvaClerk = tva.clerk;
    const newId = ds.getNewId('HLine');
    let addedEntries: DrawingReference[] = [];
    let removedEntries: DrawingReference[] = [];
    const options: any = {
      eventListener: (reasons: ChangeReasons): void => {
        addedEntries = [];
        for (const item of reasons.get(DataSourceChangeEventReason.AddEntry) || []) {
          addedEntries.push(item[0].ref);
        }

        removedEntries = [];
        for (const item of reasons.get(DataSourceChangeEventReason.RemoveEntry) || []) {
          removedEntries.push(item[0].ref);
        }
      },
    };
    const listenerSpy = vi.spyOn(options, 'eventListener');
    ds.addChangeEventListener(options.eventListener);

    ds.beginTransaction();
    ds.add({
      id: newId,
      title: 'test hline',
      type: 'HLine',
      data: { def: 0, style: { lineWidth: 1, fill: 0, color: '#00AA00' } },
      locked: false,
      visible: true,
    });

    expect(getDrawingReferencesFromIterator(ds.filtered(() => true)))
      .toEqual([drawing1.id, drawing2.id, drawing3.id, newId]);
    expect(storage.head?.value[0].ref).toEqual(drawing1.id);
    expect(storage.tail?.value[0].ref).toEqual(newId);
    expect(tva['current'].sign).toBeFalsy();

    ds.endTransaction();

    expect(listenerSpy).toHaveBeenCalledOnce();
    expect(addedEntries).toEqual([newId]);
    expect(tva['current'].sign).toBeTruthy();

    ds.beginTransaction();
    ds.remove(drawing1.id);
    ds.remove(newId);
    ds.endTransaction();

    expect(listenerSpy).toHaveBeenCalledTimes(2);
    expect(removedEntries).toEqual([drawing1.id, newId]);
    expect(tva['current'].sign).toBeTruthy();
    expect(getDrawingReferencesFromIterator(ds.filtered(() => true)))
      .toEqual([drawing2.id, drawing3.id]);
    expect(storage.head?.value[0].ref).toEqual(drawing2.id);
    expect(storage.tail?.value[0].ref).toEqual(drawing3.id);

    ds.beginTransaction();
    ds.remove(drawing2.id);
    ds.remove(drawing3.id);
    ds.endTransaction();

    expect(listenerSpy).toHaveBeenCalledTimes(3);
    expect(removedEntries).toEqual([drawing2.id, drawing3.id]);
    expect(tva['current'].sign).toBeTruthy();
    expect(getDrawingReferencesFromIterator(ds.filtered(() => true)))
      .toEqual([]);
    expect(storage.head).toBeUndefined();
    expect(storage.tail).toBeUndefined();
  });

  it('test update() entry', () => {
    const tva: TimeVarianceAuthority = new TimeVarianceAuthority();
    ds.tvaClerk = tva.clerk;
    let updatedEntries: DrawingReference[] = [];
    const options: any = {
      eventListener: (reasons: ChangeReasons): void => {
        updatedEntries = [];
        for (const item of reasons.get(DataSourceChangeEventReason.UpdateEntry) || []) {
          updatedEntries.push(item[0].ref);
        }
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    ds.addChangeEventListener(options.eventListener);
    storage.get(drawing1.id)[0].valid = true;

    expect(getDSEntry(drawing1.id)[0].valid).toBeTruthy();

    ds.beginTransaction();
    ds.update(drawing1.id, {
      title: 'test hline - updated',
    });

    const updated = getDSEntry(drawing1.id);
    expect(updated[0].options.title).toEqual('test hline - updated');
    expect(updated[0].valid).toBeFalsy();
    expect(tva['current'].sign).toBeFalsy();

    ds.endTransaction();

    expect(listenerSpy).toHaveBeenCalledOnce();
    expect(updatedEntries).toEqual([drawing1.id]);
    expect(tva['current'].sign).toBeTruthy();
  });

  it('test clone() entry', () => {
    const tva: TimeVarianceAuthority = new TimeVarianceAuthority();
    let clonedEntries: DrawingReference[] = [];
    const options: any = {
      eventListener: (reasons: ChangeReasons): void => {
        clonedEntries = [];
        for (const item of reasons.get(DataSourceChangeEventReason.AddEntry) || []) {
          clonedEntries.push(item[0].ref);
        }
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    const entry: DataSourceEntry<unknown> = storage.get(drawing1.id);

    ds.tvaClerk = tva.clerk;
    ds.addChangeEventListener(options.eventListener);
    entry[0].valid = true;

    ds.beginTransaction();
    const cloned = ds.clone(entry);

    expect(cloned[0].ref).toEqual('test4');
    expect(cloned[0].options).toEqual(entry[0].options);
    expect(cloned[0].valid).toBeFalsy();
    expect(tva['current'].sign).toBeFalsy();

    ds.endTransaction();

    expect(listenerSpy).toHaveBeenCalledOnce();
    expect(clonedEntries).toEqual(['test4']);
    expect(tva['current'].sign).toBeTruthy();
  });
});
