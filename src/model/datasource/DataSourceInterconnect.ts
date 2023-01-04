import { toRaw } from 'vue';
import type DataSourceSharedEntriesProcessor from '@/model/datasource/DataSourceSharedEntriesProcessor';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceId } from '@/model/datasource/DataSource';
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import type { DataSourceChangeEvent, DataSourceChangeEventsMap } from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingId, DrawingReference } from '@/model/datasource/Drawing';

export default class DataSourceInterconnect {
  private readonly sharedProcessors: Map<DataSourceId, DataSourceSharedEntriesProcessor> = new Map();

  public addDataSource(dataSource: DataSource): void {
    const dsId = dataSource.id;
    if (this.sharedProcessors.has(dsId)) {
      throw new Error(`Illegal state: dataSource with Id=${dsId} already exists`);
    }

    const { sharedProcessor } = toRaw(dataSource);
    sharedProcessor.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
    for (const [, dssp] of this.sharedProcessors) {
      sharedProcessor.attachSharedEntriesFrom(dssp.dataSource);
      dssp.attachSharedEntriesFrom(sharedProcessor.dataSource);
    }

    this.sharedProcessors.set(dsId, sharedProcessor);
  }

  public removeDataSource(dsId: DataSourceId): void {
    if (!this.sharedProcessors.has(dsId)) {
      throw new Error(`Illegal state: dataSource with Id=${dsId} doesn't exists`);
    }

    const sharedProcessor: DataSourceSharedEntriesProcessor = this.sharedProcessors.get(dsId) as DataSourceSharedEntriesProcessor;
    sharedProcessor.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
    this.sharedProcessors.delete(dsId);

    for (const [id, ds] of this.sharedProcessors) {
      sharedProcessor.detachSharedEntries(id);
      ds.detachSharedEntries(dsId);
    }
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap, srcDs: DataSource): void => {
    // in case when shared element can change shareWith or share state we should
    // think about new change reason

    const addEntries = this.getNotSharedEventEntries(events.get(DataSourceChangeEventReason.AddEntry) || []);
    if (addEntries.length > 0) {
      this.addEntries(addEntries, srcDs);
    }

    const removeEntries = this.getNotSharedEventEntries(events.get(DataSourceChangeEventReason.RemoveEntry) || []);
    if (removeEntries.length > 0) {
      this.removeEntries(removeEntries, srcDs);
    }

    const updateEntries = this.getNotSharedEventEntries(events.get(DataSourceChangeEventReason.UpdateEntry) || []);
    if (updateEntries.length > 0) {
      this.updateEntries(updateEntries, srcDs);
    }
  };

  private getNotSharedEventEntries(events: DataSourceChangeEvent[]): DataSourceEntry[] {
    return events.filter((e) => (!e.shared)).map((e) => (e.entry));
  }

  private addEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const entry of entries) {
      const [descriptor] = entry;
      const { shareWith } = descriptor.options;
      if (shareWith === undefined) {
        continue;
      }

      const needUpdate: Set<DataSource> = new Set<DataSource>();
      const isInternal: boolean = isString(descriptor.ref);
      const externalRef: DrawingReference = isInternal ? [srcDs.id, descriptor.ref as DrawingId] : descriptor.ref;
      const internalRef: DrawingReference = isInternal ? descriptor.ref : descriptor.ref[1];

      if (shareWith === '*') {
        for (const [cid, dssp] of this.sharedProcessors) {
          if (srcDs.id !== cid) {
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.addEntry(entryRef, entry[0].options);
            needUpdate.add(dssp.dataSource);
          }
        }
      } else {
        for (const cid of [...shareWith, externalRef[0]]) {
          if (srcDs.id !== cid) {
            const dssp: DataSourceSharedEntriesProcessor = this.sharedProcessors.get(cid) as DataSourceSharedEntriesProcessor;
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.addEntry(entryRef, entry[0].options);
            needUpdate.add(dssp.dataSource);
          }
        }
      }

      for (const ds of needUpdate) {
        ds.flush();
      }
    }
  }

  private removeEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const [descriptor] of entries) {
      const { shareWith } = descriptor.options;
      if (shareWith === undefined) {
        continue;
      }

      const needUpdate: Set<DataSource> = new Set<DataSource>();
      const isInternal: boolean = isString(descriptor.ref);
      const externalRef: DrawingReference = isInternal ? [srcDs.id, descriptor.ref as DrawingId] : descriptor.ref;
      const internalRef: DrawingReference = isInternal ? descriptor.ref : descriptor.ref[1];

      if (shareWith === '*') {
        for (const [cid, dssp] of this.sharedProcessors) {
          if (srcDs.id !== cid) {
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.removeEntry(entryRef);
            needUpdate.add(dssp.dataSource);
          }
        }
      } else {
        for (const cid of [...shareWith, externalRef[0]]) {
          if (srcDs.id !== cid) {
            const dssp: DataSourceSharedEntriesProcessor = this.sharedProcessors.get(cid) as DataSourceSharedEntriesProcessor;
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.removeEntry(entryRef);
            needUpdate.add(dssp.dataSource);
          }
        }
      }

      for (const ds of needUpdate) {
        ds.flush();
      }
    }
  }

  private updateEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const [descriptor] of entries) {
      const { shareWith } = descriptor.options;
      if (shareWith === undefined) {
        continue;
      }

      const needUpdate: Set<DataSource> = new Set<DataSource>();
      const isInternal: boolean = isString(descriptor.ref);
      const externalRef: DrawingReference = isInternal ? [srcDs.id, descriptor.ref as DrawingId] : descriptor.ref;
      const internalRef: DrawingReference = isInternal ? descriptor.ref : descriptor.ref[1];

      if (shareWith === '*') {
        for (const [cid, dssp] of this.sharedProcessors) {
          if (srcDs.id !== cid) {
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.update(entryRef);
            needUpdate.add(dssp.dataSource);
          }
        }
      } else {
        for (const cid of [...shareWith, externalRef[0]]) {
          if (srcDs.id !== cid) {
            const dssp: DataSourceSharedEntriesProcessor = this.sharedProcessors.get(cid) as DataSourceSharedEntriesProcessor;
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.update(entryRef);
            needUpdate.add(dssp.dataSource);
          }
        }
      }

      for (const ds of needUpdate) {
        ds.flush();
      }
    }
  }
}
