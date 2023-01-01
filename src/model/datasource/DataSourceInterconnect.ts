import { toRaw } from 'vue';
import type DataSourceSharedProcessor from '@/model/datasource/DataSourceSharedProcessor';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceId } from '@/model/datasource/DataSource';
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import type { ChangeReasons } from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingId, DrawingReference } from '@/model/datasource/Drawing';

export default class DataSourceInterconnect {
  private readonly sharedProcessors: Map<DataSourceId, DataSourceSharedProcessor> = new Map();

  public addDataSource(dataSource: DataSource): void {
    const dsId = dataSource.id;
    if (this.sharedProcessors.has(dsId)) {
      throw new Error(`Illegal state: dataSource with Id=${dsId} already exists`);
    }

    const { sharedProcessor } = toRaw(dataSource);
    sharedProcessor.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
    for (const [id, dssp] of this.sharedProcessors) {
      sharedProcessor.attachExternalEntries(id, dssp.shared(dsId));
      dssp.attachExternalEntries(dsId, sharedProcessor.shared(id));
    }

    this.sharedProcessors.set(dsId, sharedProcessor);
  }

  public removeDataSource(dsId: DataSourceId): void {
    if (!this.sharedProcessors.has(dsId)) {
      throw new Error(`Illegal state: dataSource with Id=${dsId} doesn't exists`);
    }

    const sharedProcessor: DataSourceSharedProcessor = this.sharedProcessors.get(dsId) as DataSourceSharedProcessor;
    sharedProcessor.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
    this.sharedProcessors.delete(dsId);

    for (const [id, ds] of this.sharedProcessors) {
      sharedProcessor.detachExternalEntries(id);
      ds.detachExternalEntries(dsId);
    }
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: ChangeReasons, srcDs: DataSource): void => {
    // in case when shared element can change shareWith or share state we should
    // think about new change reason

    if (reasons.has(DataSourceChangeEventReason.AddEntry)) {
      this.addEntries(reasons.get(DataSourceChangeEventReason.AddEntry) || [], srcDs);
    }

    if (reasons.has(DataSourceChangeEventReason.RemoveEntry)) {
      this.removeEntries(reasons.get(DataSourceChangeEventReason.RemoveEntry) || [], srcDs);
    }

    if (reasons.has(DataSourceChangeEventReason.UpdateEntry)) {
      this.updateEntries(reasons.get(DataSourceChangeEventReason.UpdateEntry) || [], srcDs);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private addEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const [descriptor] of entries) {
      if (descriptor.options.shareWith === undefined) {
        continue;
      }

      console.log('new shared entry'); // todo: !!
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private removeEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const [descriptor] of entries) {
      if (descriptor.options.shareWith === undefined) {
        continue;
      }

      console.log('remove shared entry'); // todo: !!
    }
  }

  private updateEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
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
            dssp.sharedUpdate(entryRef);
            needUpdate.add(dssp.dataSource);
          }
        }
      } else {
        for (const cid of [...shareWith, externalRef[0]]) {
          if (srcDs.id !== cid) {
            const dssp: DataSourceSharedProcessor = this.sharedProcessors.get(cid) as DataSourceSharedProcessor;
            const entryRef = externalRef[0] === cid ? internalRef : externalRef;
            dssp.sharedUpdate(entryRef);
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
