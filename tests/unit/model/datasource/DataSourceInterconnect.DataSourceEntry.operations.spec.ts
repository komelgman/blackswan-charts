import type { MockInstance } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clone } from '@/misc/object.clone';
import DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';
import {
  type DataSourceEntry,
  type DrawingOptions,
  type DrawingReference,
  isEqualDrawingReference,
} from '@/model/datasource/types';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import IdHelper from '@/model/tools/IdHelper';

describe('DataSourceSharedEntries | DataSource entries operations', () => {
  let interconnect: DataSourceInterconnect;
  let ds1: DataSource;
  let ds2: DataSource;
  let ds3: DataSource;
  let idHelper: IdHelper;
  let ds1Spy: MockInstance;
  let ds2Spy: MockInstance;
  let ds3Spy: MockInstance;
  let ds1Events: DataSourceChangeEventsMap;
  let ds2Events: DataSourceChangeEventsMap;
  let ds3Events: DataSourceChangeEventsMap;

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
    title: 'test title',
    locked: false,
    visible: true,
    shareWith: ['ds2'],
  };

  const drawing2: DrawingOptions = {
    id: 'test2',
    data: 'test entry2',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: ['ds3'],
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

  const drawing5: DrawingOptions = {
    id: 'test5',
    data: 'test entry5',
    type: 'test',
    locked: false,
    visible: false,
    shareWith: ['ds1', 'ds2'],
  };

  function getDrawingReferencesFromIterator(ii: IterableIterator<Readonly<DataSourceEntry>>): DrawingReference[] {
    const result: DrawingReference[] = [];
    for (const item of ii) {
      result.push(item.descriptor.ref);
    }
    return result;
  }

  function toRefsFromEventsMap(events: DataSourceChangeEventsMap, reason: DataSourceChangeEventReason): DrawingReference[] {
    if (events === undefined) {
      return [];
    }

    return (events.get(reason) || []).map((event) => (event.entry.descriptor.ref));
  }

  function getDSEntry(ds: DataSource, ref: DrawingReference): Readonly<DataSourceEntry> {
    const filtered: IterableIterator<Readonly<DataSourceEntry>> = ds.filtered((p) => isEqualDrawingReference(p.descriptor.ref, ref));
    return filtered.next().value;
  }

  beforeEach(async () => {
    const tva: TimeVarianceAuthority = new TimeVarianceAuthority();
    interconnect = new DataSourceInterconnect();
    idHelper = new IdHelper();
    ds1 = new DataSource({ id: 'ds1', idHelper }, clone([drawing0, drawing1, drawing2]));
    ds2 = new DataSource({ id: 'ds2', idHelper }, clone([drawing2, drawing3, drawing4]));
    ds3 = new DataSource({ id: 'ds3', idHelper }, clone([drawing3, drawing5]));
    ds1.tvaClerk = tva.clerk;
    ds2.tvaClerk = tva.clerk;
    ds3.tvaClerk = tva.clerk;
    interconnect.addDataSource(ds1);
    interconnect.addDataSource(ds2);
    interconnect.addDataSource(ds3);

    const options: any = {
      ds1EventListener: (events: DataSourceChangeEventsMap): void => {
        ds1Events = events;
      },
      ds2EventListener: (events: DataSourceChangeEventsMap): void => {
        ds2Events = events;
      },
      ds3EventListener: (events: DataSourceChangeEventsMap): void => {
        ds3Events = events;
      },
    };

    ds1Spy = vi.spyOn(options, 'ds1EventListener');
    ds2Spy = vi.spyOn(options, 'ds2EventListener');
    ds3Spy = vi.spyOn(options, 'ds3EventListener');

    ds1.addChangeEventListener(options.ds1EventListener);
    ds2.addChangeEventListener(options.ds2EventListener);
    ds3.addChangeEventListener(options.ds3EventListener);

    ds1Events = new Map();
    ds2Events = new Map();
    ds3Events = new Map();
  });

  it('test add shared entry', () => {
    const ds2NewId = ds2.getNewId('HLine');
    ds2.beginTransaction();
    ds2.add({
      id: ds2NewId,
      title: 'test hline',
      type: 'HLine',
      data: { def: 0, style: { lineWidth: 1, fill: 0, color: '#00AA00' } },
      locked: false,
      visible: true,
      shareWith: ['ds1'],
    });
    ds2.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([[ds2.id, ds2NewId]]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([ds2NewId]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([]);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        [ds2.id, drawing3.id],
        [ds2.id, ds2NewId],
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        drawing2.id,
        drawing3.id,
        drawing4.id,
        ds2NewId,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test remove shared entry', () => {
    ds1.beginTransaction();
    ds1.remove(drawing0.id);
    ds1.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledOnce();

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.RemoveEntry))
      .toEqual([drawing0.id]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.RemoveEntry))
      .toEqual([[ds1.id, drawing0.id]]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.RemoveEntry))
      .toEqual([[ds1.id, drawing0.id]]);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        [ds2.id, drawing3.id],
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing1.id],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test remove external shared entry', () => {
    ds1.beginTransaction();
    ds1.remove([ds2.id, drawing3.id]);
    ds1.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.RemoveEntry))
      .toEqual([[ds2.id, drawing3.id]]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.RemoveEntry))
      .toEqual([drawing3.id]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.RemoveEntry))
      .toEqual([]);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        drawing2.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test update shared entry', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    ds1['storage'].get(drawing1.id).descriptor.valid = true;
    // eslint-disable-next-line @typescript-eslint/dot-notation
    ds2['storage'].get([ds1.id, drawing1.id]).descriptor.valid = true;

    const ds1Entry = getDSEntry(ds1, drawing1.id);
    expect(ds1Entry.descriptor.valid).toBeTruthy();
    expect(ds1Entry.descriptor.options.title).toEqual('test title');

    const ds2Entry = getDSEntry(ds2, [ds1.id, drawing1.id]);
    expect(ds2Entry.descriptor.valid).toBeTruthy();
    expect(ds2Entry.descriptor.options.title).toEqual('test title');

    ds1.beginTransaction();
    ds1.update(drawing1.id, {
      title: 'test hline - updated',
    });
    ds1.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([drawing1.id]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([[ds1.id, drawing1.id]]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([]);

    const updatedDs1Entry = getDSEntry(ds1, drawing1.id);
    expect(updatedDs1Entry.descriptor.valid).toBeFalsy();
    expect(updatedDs1Entry.descriptor.options.title).toEqual('test hline - updated');

    const updatedDs2Entry = getDSEntry(ds2, [ds1.id, drawing1.id]);
    expect(updatedDs2Entry.descriptor.valid).toBeFalsy();
    expect(updatedDs2Entry.descriptor.options.title).toEqual('test hline - updated');

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        [ds2.id, drawing3.id],
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test update external shared entry', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    ds1['storage'].get(drawing1.id).descriptor.valid = true;
    // eslint-disable-next-line @typescript-eslint/dot-notation
    ds2['storage'].get([ds1.id, drawing1.id]).descriptor.valid = true;

    const ds1Entry = getDSEntry(ds1, drawing1.id);
    expect(ds1Entry.descriptor.valid).toBeTruthy();
    expect(ds1Entry.descriptor.options.title).toEqual('test title');

    const ds2Entry = getDSEntry(ds2, [ds1.id, drawing1.id]);
    expect(ds2Entry.descriptor.valid).toBeTruthy();
    expect(ds2Entry.descriptor.options.title).toEqual('test title');

    ds2.beginTransaction();
    ds2.update([ds1.id, drawing1.id], {
      title: 'test hline - updated',
    });
    ds2.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([drawing1.id]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([[ds1.id, drawing1.id]]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.UpdateEntry))
      .toEqual([]);

    const updatedDs1Entry = getDSEntry(ds1, drawing1.id);
    expect(updatedDs1Entry.descriptor.valid).toBeFalsy();
    expect(updatedDs1Entry.descriptor.options.title).toEqual('test hline - updated');

    const updatedDs2Entry = getDSEntry(ds2, [ds1.id, drawing1.id]);
    expect(updatedDs2Entry.descriptor.valid).toBeFalsy();
    expect(updatedDs2Entry.descriptor.options.title).toEqual('test hline - updated');

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        [ds2.id, drawing3.id],
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test clone shared entry', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const originalEntry: DataSourceEntry = ds1['storage'].get(drawing1.id);
    originalEntry.descriptor.valid = true;

    ds1.beginTransaction();
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const clonedEntry = ds1.clone(ds1['storage'].get(drawing1.id));
    ds1.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(clonedEntry.descriptor.ref).toEqual('test3');
    expect(clonedEntry.descriptor.options).toEqual(originalEntry.descriptor.options);
    expect(clonedEntry.descriptor.valid).toBeFalsy();

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.AddEntry))
      .toEqual(['test3']);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([[ds1.id, 'test3']]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([]);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        [ds2.id, drawing3.id],
        drawing0.id,
        drawing1.id,
        drawing2.id,
        'test3',
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        [ds1.id, 'test3'],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test clone external shared entry', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const originalEntry: DataSourceEntry = ds1['storage'].get(drawing1.id);
    originalEntry.descriptor.valid = true;

    ds2.beginTransaction();
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const clonedEntry = ds2.clone(ds2['storage'].get([ds1.id, drawing1.id]));
    ds2.endTransaction();

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(clonedEntry.descriptor.ref).toEqual([ds1.id, 'test3']);
    expect(clonedEntry.descriptor.options).toEqual(originalEntry.descriptor.options);
    expect(clonedEntry.descriptor.valid).toBeFalsy();

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.AddEntry))
      .toEqual(['test3']);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([[ds1.id, 'test3']]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.AddEntry))
      .toEqual([]);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing3.id],
        [ds3.id, drawing5.id],
        [ds2.id, drawing3.id],
        drawing0.id,
        drawing1.id,
        drawing2.id,
        'test3',
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        [ds1.id, 'test3'],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        [ds1.id, drawing0.id],
        [ds1.id, drawing2.id],
        drawing3.id,
        drawing5.id,
      ]);
  });

  it('test requestDataUpdate shared entry', () => {
    ds1.requestDataUpdate(ds1.storage.get(drawing1.id));

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.DataInvalid))
      .toEqual([drawing1.id]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.DataInvalid))
      .toEqual([[ds1.id, drawing1.id]]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.DataInvalid))
      .toEqual([]);
  });

  it('test requestDataUpdate external shared entry', () => {
    ds2.requestDataUpdate(ds2.storage.get([ds1.id, drawing1.id]));

    expect(ds1Spy).toHaveBeenCalledOnce();
    expect(ds2Spy).toHaveBeenCalledOnce();
    expect(ds3Spy).toHaveBeenCalledTimes(0);

    expect(toRefsFromEventsMap(ds1Events, DataSourceChangeEventReason.DataInvalid))
      .toEqual([drawing1.id]);
    expect(toRefsFromEventsMap(ds2Events, DataSourceChangeEventReason.DataInvalid))
      .toEqual([[ds1.id, drawing1.id]]);
    expect(toRefsFromEventsMap(ds3Events, DataSourceChangeEventReason.DataInvalid))
      .toEqual([]);
  });
});
