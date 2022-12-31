import { toRaw } from 'vue';
import type DataSourceSharedProcessor from '@/model/datasource/DataSourceSharedProcessor';
import type { PaneId } from '@/components/layout/PaneDescriptor';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import type { ChangeReasons } from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingId, DrawingReference } from '@/model/datasource/Drawing';

export default class DataSourceInterconnect {
  private readonly sharedProcessors: Map<PaneId, DataSourceSharedProcessor> = new Map();

  public addDataSource(paneId: PaneId, dataSource: DataSource): void {
    if (this.sharedProcessors.has(paneId)) {
      throw new Error(`Illegal state: dataSource with paneId=${paneId} already exists`);
    }

    const { sharedProcessor } = toRaw(dataSource);
    sharedProcessor.paneId = paneId;
    sharedProcessor.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);

    for (const [id, dssp] of this.sharedProcessors) {
      sharedProcessor.attachExternalEntries(id, dssp.shared(paneId));
      dssp.attachExternalEntries(paneId, sharedProcessor.shared(id));
    }

    this.sharedProcessors.set(paneId, sharedProcessor);
  }

  public removeDataSource(paneId: PaneId): void {
    if (!this.sharedProcessors.has(paneId)) {
      throw new Error(`Illegal state: dataSource with paneId=${paneId} doesn''t exists`);
    }

    const sharedProcessor: DataSourceSharedProcessor = this.sharedProcessors.get(paneId) as DataSourceSharedProcessor;
    sharedProcessor.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
    sharedProcessor.paneId = undefined;
    this.sharedProcessors.delete(paneId);

    for (const [id, ds] of this.sharedProcessors) {
      sharedProcessor.detachExternalEntries(id);
      ds.detachExternalEntries(paneId);
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
    const sourcePaneId = srcDs.sharedProcessor.paneId;

    for (const entry of entries) {
      const [descriptor] = entry;
      const { shareWith } = descriptor.options;
      if (shareWith === undefined) {
        continue;
      }

      const needUpdate: Set<DataSource> = new Set<DataSource>();
      const isInternal: boolean = isString(descriptor.ref);
      const externalRef: DrawingReference = isInternal ? [sourcePaneId, descriptor.ref as DrawingId] : descriptor.ref;
      const internalRef: DrawingReference = isInternal ? descriptor.ref : descriptor.ref[1];

      if (shareWith === '*') {
        for (const [, dssp] of this.sharedProcessors) {
          const currentPaneId: PaneId = dssp.paneId;
          if (sourcePaneId !== currentPaneId) {
            const entryRef = externalRef[0] === currentPaneId ? internalRef : externalRef;
            dssp.sharedUpdate(entryRef);
            needUpdate.add(dssp.dataSource);
          }
        }
      } else {
        for (const pid of [...shareWith, externalRef[0]]) {
          if (sourcePaneId !== pid) {
            const dssp: DataSourceSharedProcessor = this.sharedProcessors.get(pid) as DataSourceSharedProcessor;
            const entryRef = externalRef[0] === pid ? internalRef : externalRef;
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
