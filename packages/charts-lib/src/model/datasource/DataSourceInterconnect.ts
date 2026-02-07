import { isString, NonReactive } from '@blackswan/foundation';
import type DataSource from '@/model/datasource/DataSource';
import type DataSourceSharedEntries from '@/model/datasource/DataSourceSharedEntries';
import {
  type DataSourceChangeEvent,
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type {
  DataSourceEntry,
  DataSourceId,
  DrawingDescriptor,
  DrawingId,
  DrawingReference,
} from '@/model/datasource/types';
declare type Action = (dsse: DataSourceSharedEntries, ref: DrawingReference, descriptor: DrawingDescriptor) => void;

@NonReactive
export default class DataSourceInterconnect {
  private readonly dsSharedEntries: Map<DataSourceId, DataSourceSharedEntries> = new Map();

  public addDataSource(dataSource: DataSource): void {
    const dsId = dataSource.id;
    if (this.dsSharedEntries.has(dsId)) {
      throw new Error(`Illegal state: dataSource with Id=${dsId} already exists`);
    }

    const { sharedEntries } = dataSource;
    sharedEntries.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
    for (const [, dsse] of this.dsSharedEntries) {
      sharedEntries.attachSharedEntriesFrom(dsse.dataSource);
      dsse.attachSharedEntriesFrom(sharedEntries.dataSource);
    }

    this.dsSharedEntries.set(dsId, sharedEntries);
  }

  public removeDataSource(dsId: DataSourceId): void {
    if (!this.dsSharedEntries.has(dsId)) {
      throw new Error(`Illegal state: dataSource with Id=${dsId} doesn't exists`);
    }

    const sharedProcessor: DataSourceSharedEntries = this.dsSharedEntries.get(dsId) as DataSourceSharedEntries;
    sharedProcessor.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
    this.dsSharedEntries.delete(dsId);

    for (const [id, ds] of this.dsSharedEntries) {
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

    const updateEntries = this.getNotSharedEventEntries(events.get(DataSourceChangeEventReason.UpdateEntry) || []);
    if (updateEntries.length > 0) {
      this.updateEntries(updateEntries, srcDs);
    }

    const removeEntries = this.getNotSharedEventEntries(events.get(DataSourceChangeEventReason.RemoveEntry) || []);
    if (removeEntries.length > 0) {
      this.removeEntries(removeEntries, srcDs);
    }

    const updateDataRequestEntries = this.getNotSharedEventEntries(events.get(DataSourceChangeEventReason.DataInvalid) || []);
    if (updateDataRequestEntries.length > 0) {
      this.requestDataUpdateForEntries(updateDataRequestEntries, srcDs);
    }
  };

  private getNotSharedEventEntries(events: DataSourceChangeEvent[]): DataSourceEntry[] {
    return events.filter((e) => (!e.shared)).map((e) => (e.entry));
  }

  private addEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    const action: Action = (dsse, ref, descriptor) => dsse.addEntry(ref, descriptor.options);

    this.applyActionToSharedEntries(entries, srcDs, action);
  }

  private removeEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    const action: Action = (dsse: DataSourceSharedEntries, ref: DrawingReference) => dsse.removeEntry(ref);

    this.applyActionToSharedEntries(entries, srcDs, action);
  }

  private updateEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    const action: Action = (dsse: DataSourceSharedEntries, ref: DrawingReference) => dsse.update(ref);

    this.applyActionToSharedEntries(entries, srcDs, action);
  }

  private requestDataUpdateForEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    const action: Action = (dsse: DataSourceSharedEntries, ref: DrawingReference) => dsse.requestDataUpdate(ref);

    this.applyActionToSharedEntries(entries, srcDs, action);
  }

  private applyActionToSharedEntries(entries: DataSourceEntry[], srcDs: DataSource, action: Action): void {
    const needUpdate: Set<DataSource> = new Set<DataSource>();

    for (const { descriptor } of entries) {
      const { shareWith } = descriptor.options;
      if (shareWith === undefined) {
        continue;
      }

      const isInternal: boolean = isString(descriptor.ref);
      const externalRef: DrawingReference = isInternal ? [srcDs.id, descriptor.ref as DrawingId] : descriptor.ref;
      const internalRef: DrawingReference = isInternal ? descriptor.ref : descriptor.ref[1];

      if (shareWith === '*') {
        for (const [cid, dsse] of this.dsSharedEntries) {
          if (srcDs.id !== cid) {
            const ref = externalRef[0] === cid ? internalRef : externalRef;
            action(dsse, ref, descriptor);
            needUpdate.add(dsse.dataSource);
          }
        }
      } else {
        for (const cid of [...shareWith, externalRef[0]]) {
          if (srcDs.id !== cid) {
            const dsse: DataSourceSharedEntries = this.dsSharedEntries.get(cid) as DataSourceSharedEntries;
            const ref = externalRef[0] === cid ? internalRef : externalRef;
            action(dsse, ref, descriptor);
            needUpdate.add(dsse.dataSource);
          }
        }
      }
    }

    for (const ds of needUpdate) {
      ds.flush();
    }
  }
}
