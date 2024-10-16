/* eslint-disable @typescript-eslint/dot-notation */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clone } from '@/misc/object.clone';
import DataSource from '@/model/datasource/DataSource';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';
import {
  type DataSourceEntry,
  type DrawingOptions,
  type DrawingReference,
  isEqualDrawingReference,
} from '@/model/datasource/types';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import IdHelper from '@/model/tools/IdHelper';

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
      result.push(item.value.descriptor.ref);
      item = item.next;
    }

    return result;
  }

  function getDrawingReferencesFromIterator(ii: IterableIterator<Readonly<DataSourceEntry>>): DrawingReference[] {
    const result: DrawingReference[] = [];
    for (const item of ii) {
      result.push(item.descriptor.ref);
    }
    return result;
  }

  function getDSEntry(ref: DrawingReference): Readonly<DataSourceEntry> {
    const filtered: IterableIterator<Readonly<DataSourceEntry>> = ds.filtered((p) => isEqualDrawingReference(p.descriptor.ref, ref));
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
      references.push(dse.descriptor.ref);
    }

    expect(references).toEqual([drawing1.id, drawing2.id, drawing3.id]);
  });

  it('test visible() iterator', () => {
    function dataSourceChangeEventListener(events: DataSourceChangeEventsMap): void {
      for (const event of events.get(DataSourceChangeEventReason.CacheReset) || []) {
        event.entry.descriptor.visibleInViewport = true;
      }
    }

    ds.addChangeEventListener(dataSourceChangeEventListener);
    ds.resetCache();
    ds.flush();

    expect(getDrawingReferencesFromIterator(ds.visible())).toEqual([drawing1.id, drawing2.id]);
    expect(getDrawingReferencesFromIterator(ds.visible(true))).toEqual([drawing2.id, drawing1.id]);
  });

  it('test filtered() iterator', () => {
    const drawingReferencesFromIterator: DrawingReference[] = getDrawingReferencesFromIterator(ds.filtered((p) => p.descriptor.ref !== drawing3.id));
    expect(drawingReferencesFromIterator).toEqual([drawing1.id, drawing2.id]);
  });

  it('test (add|remove)ChangeEventListener()/resetCache()', () => {
    let entries: DataSourceEntry[] = [];
    const options: any = {
      eventListener: (events: DataSourceChangeEventsMap): void => {
        entries = (events.get(DataSourceChangeEventReason.CacheReset) || []).map((event) => (event.entry));
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    expect(listenerSpy).not.toHaveBeenCalled();

    ds.addChangeEventListener(options.eventListener);
    ds.resetCache();

    expect(listenerSpy).toHaveBeenCalledOnce();
    expect(entries.map((e) => e.descriptor.ref)).toEqual([drawing1.id, drawing2.id, drawing3.id]);

    listenerSpy.mockClear();
    ds.removeChangeEventListener(options.eventListener);
    ds.resetCache();

    expect(listenerSpy).not.toHaveBeenCalled();
  });

  it('test invalidated()', () => {
    let entriesWhichWasReset: DataSourceEntry[] = [];
    let entriesWhichWasInvalidated: DataSourceEntry[] = [];
    const options: any = {
      eventListener: (events: DataSourceChangeEventsMap): void => {
        entriesWhichWasReset = (events.get(DataSourceChangeEventReason.CacheReset) || []).map((event) => (event.entry));
        entriesWhichWasInvalidated = (events.get(DataSourceChangeEventReason.CacheInvalidated) || []).map((event) => (event.entry));
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    ds.addChangeEventListener(options.eventListener);
    ds.resetCache();

    expect(listenerSpy).toHaveBeenCalled();
    expect(entriesWhichWasInvalidated.map((e) => e.descriptor.ref)).toEqual([]);

    listenerSpy.mockClear();
    ds.invalidated(entriesWhichWasReset);

    expect(listenerSpy).toHaveBeenCalled();
    expect(entriesWhichWasInvalidated.map((e) => e.descriptor.ref)).toEqual([drawing1.id, drawing2.id, drawing3.id]);
  });

  it('test (begin|end)Transaction()', () => {
    const tva: TimeVarianceAuthority = new TimeVarianceAuthority();
    ds.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);

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
    ds.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);
    const newId = ds.getNewId('HLine');
    let addedEntries: DrawingReference[] = [];
    let removedEntries: DrawingReference[] = [];
    const options: any = {
      eventListener: (events: DataSourceChangeEventsMap): void => {
        addedEntries = (events.get(DataSourceChangeEventReason.AddEntry) || []).map((event) => (event.entry.descriptor.ref));
        removedEntries = (events.get(DataSourceChangeEventReason.RemoveEntry) || []).map((event) => (event.entry.descriptor.ref));
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
    expect(storage.head?.value.descriptor.ref).toEqual(drawing1.id);
    expect(storage.tail?.value.descriptor.ref).toEqual(newId);
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
    expect(storage.head?.value.descriptor.ref).toEqual(drawing2.id);
    expect(storage.tail?.value.descriptor.ref).toEqual(drawing3.id);

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
    ds.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);
    let updatedEntries: DrawingReference[] = [];
    const options: any = {
      eventListener: (events: DataSourceChangeEventsMap): void => {
        updatedEntries = (events.get(DataSourceChangeEventReason.UpdateEntry) || []).map((event) => (event.entry.descriptor.ref));
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    ds.addChangeEventListener(options.eventListener);
    storage.get(drawing1.id).descriptor.valid = true;

    expect(getDSEntry(drawing1.id).descriptor.valid).toBeTruthy();

    ds.beginTransaction();
    ds.update(drawing1.id, {
      title: 'test hline - updated',
    });

    const updated = getDSEntry(drawing1.id);
    expect(updated.descriptor.options.title).toEqual('test hline - updated');
    expect(updated.descriptor.valid).toBeFalsy();
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
      eventListener: (events: DataSourceChangeEventsMap): void => {
        clonedEntries = (events.get(DataSourceChangeEventReason.AddEntry) || []).map((event) => (event.entry.descriptor.ref));
      },
    };

    const listenerSpy = vi.spyOn(options, 'eventListener');
    const entry: DataSourceEntry<unknown> = storage.get(drawing1.id);

    ds.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);
    ds.addChangeEventListener(options.eventListener);
    entry.descriptor.valid = true;

    ds.beginTransaction();
    const cloned = ds.clone(entry);

    expect(cloned.descriptor.ref).toEqual('test4');
    expect(cloned.descriptor.options).toEqual(entry.descriptor.options);
    expect(cloned.descriptor.valid).toBeFalsy();
    expect(tva['current'].sign).toBeFalsy();

    ds.endTransaction();

    expect(listenerSpy).toHaveBeenCalledOnce();
    expect(clonedEntries).toEqual(['test4']);
    expect(tva['current'].sign).toBeTruthy();
  });
});
