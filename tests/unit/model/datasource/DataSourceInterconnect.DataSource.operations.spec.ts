import { beforeEach, describe, expect, it } from 'vitest';
import { clone } from '@/misc/object.clone';
import DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import type { DataSourceEntry, DrawingOptions, DrawingReference } from '@/model/datasource/types';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import IdHelper from '@/model/tools/IdHelper';

describe('DataSourceSharedEntries | DataSource operations', () => {
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
      result.push(item.descriptor.ref);
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
    ds1.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);
    ds2.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);
    ds3.historicalIncidentReportProcessor = tva.reportProcessor.bind(tva);
  });

  it('test add DataSource', () => {
    interconnect.addDataSource(ds1);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        drawing3.id,
        drawing5.id,
      ]);

    interconnect.addDataSource(ds2);

    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing3.id],
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds1.id, drawing0.id],
        [ds1.id, drawing1.id],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        drawing3.id,
        drawing5.id,
      ]);

    interconnect.addDataSource(ds3);

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

  it('test remove DataSource', () => {
    interconnect.addDataSource(ds1);
    interconnect.addDataSource(ds2);
    interconnect.addDataSource(ds3);

    interconnect.removeDataSource(ds1.id);
    expect(getDrawingReferencesFromIterator(ds1.filtered(() => true)))
      .toEqual([
        drawing0.id,
        drawing1.id,
        drawing2.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds2.filtered(() => true)))
      .toEqual([
        [ds3.id, drawing5.id],
        drawing2.id,
        drawing3.id,
        drawing4.id,
      ]);

    expect(getDrawingReferencesFromIterator(ds3.filtered(() => true)))
      .toEqual([
        [ds2.id, drawing2.id],
        [ds2.id, drawing4.id],
        drawing3.id,
        drawing5.id,
      ]);
  });
});
