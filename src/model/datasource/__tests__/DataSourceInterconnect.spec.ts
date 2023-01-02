import { beforeEach, describe, expect, it } from 'vitest';
import { clone } from '@/misc/strict-type-checks';
import IdHelper from '@/model/tools/IdHelper';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions, DrawingReference } from '@/model/datasource/Drawing';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import TimeVarianceAuthority from '../../history/TimeVarianceAuthority';
// import type { DataSourceChangeEventsMap } from '../DataSourceChangeEventListener';
// import DataSourceChangeEventReason from '../DataSourceChangeEventReason';
import DataSourceInterconnect from '../DataSourceInterconnect';

describe('DataSourceSharedEntriesProcessor', () => {
  let interconnect: DataSourceInterconnect;
  let ds1: DataSource;
  let ds2: DataSource;
  let ds3: DataSource;
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
      result.push(item[0].ref);
    }
    return result;
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
  });

  it('test add/remove DataSource', () => {
    interconnect.addDataSource(ds1);
    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([drawing0.id, drawing1.id, drawing2.id]);
    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([drawing2.id, drawing3.id, drawing4.id]);

    interconnect.addDataSource(ds2);
    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([[ds2.id, drawing3.id], drawing0.id, drawing1.id, drawing2.id]);
    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([[ds1.id, drawing0.id], [ds1.id, drawing1.id], drawing2.id, drawing3.id, drawing4.id]);

    interconnect.removeDataSource(ds1.id);
    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([drawing0.id, drawing1.id, drawing2.id]);
    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([drawing2.id, drawing3.id, drawing4.id]);
  });

  it('test add new shared entry', () => {
    interconnect.addDataSource(ds1);
    interconnect.addDataSource(ds2);
    interconnect.addDataSource(ds3);

    // let addedEntries: DrawingReference[] = [];
    // let removedEntries: DrawingReference[] = [];
    // const options: any = {
    //   eventListener: (events: DataSourceChangeEventsMap): void => {
    //     addedEntries = (events.get(DataSourceChangeEventReason.AddEntry) || []).map((event) => (event.entry[0].ref));
    //     removedEntries = (events.get(DataSourceChangeEventReason.RemoveEntry) || []).map((event) => (event.entry[0].ref));
    //   },
    // };

    // const listenerSpy = vi.spyOn(options, 'eventListener');
    // ds1.addChangeEventListener(options.eventListener);
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
  });
});
