import { PaneId } from '@/components/layout/PaneDescriptor';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import DataSourceChangeEventListener, {
  ChangeReasons,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { DrawingId, DrawingReference } from '@/model/datasource/Drawing';
import { toRaw } from 'vue';

export default class DataSourceInterconnect {
  private readonly dataSources: Map<PaneId, DataSource> = new Map();
  private readonly paneIds: Map<DataSource, PaneId> = new Map();

  public addDataSource(paneId: PaneId, dataSource: DataSource): void {
    if (this.dataSources.has(paneId)) {
      throw new Error(`Illegal state: dataSource with paneId=${paneId} already exists`);
    }

    const rawDS: DataSource = toRaw(dataSource);
    rawDS.interconnect = this;
    rawDS.addChangeEventListener(this.dataSourceChangeEventListener);

    for (const [id, ds] of this.dataSources) {
      rawDS.attachExternal(id, ds.shared(paneId));
      ds.attachExternal(paneId, rawDS.shared(id));
    }

    this.dataSources.set(paneId, rawDS);
    this.paneIds.set(rawDS, paneId);
  }

  public removeDataSource(paneId: PaneId): void {
    if (!this.dataSources.has(paneId)) {
      throw new Error(`Illegal state: dataSource with paneId=${paneId} doesn''t exists`);
    }

    const dataSource: DataSource = this.dataSources.get(paneId) as DataSource;
    dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
    this.dataSources.delete(paneId);
    this.paneIds.delete(dataSource);

    for (const [id, ds] of this.dataSources) {
      dataSource.detachExternal(id);
      ds.detachExternal(paneId);
    }
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: ChangeReasons, srcDs: DataSource): void => {
    // in case when shared element can change shareWith or share state we should
    // think about new change reason

    if (reasons.has(DataSourceChangeEventReason.AddEntry)) {
      this.addEntries(reasons.get(DataSourceChangeEventReason.UpdateEntry) || [], srcDs);
    }

    if (reasons.has(DataSourceChangeEventReason.RemoveEntry)) {
      this.removeEntries(reasons.get(DataSourceChangeEventReason.RemoveEntry) || [], srcDs);
    }

    if (reasons.has(DataSourceChangeEventReason.UpdateEntry)) {
      this.updateEntries(reasons.get(DataSourceChangeEventReason.UpdateEntry) || [], srcDs);
    }
  };

  private addEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const [descriptor] of entries) {
      if (!descriptor.options.shared) {
        continue;
      }

      console.log('new shared entry'); // todo: !!
    }
  }

  private removeEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    for (const [descriptor] of entries) {
      if (!descriptor.options.shared) {
        continue;
      }

      console.log('remove shared entry'); // todo: !!
    }
  }

  private updateEntries(entries: DataSourceEntry[], srcDs: DataSource): void {
    const sourcePainId = this.paneIds.get(toRaw(srcDs)) as PaneId;

    for (const entry of entries) {
      const [descriptor] = entry;

      if (!descriptor.options.shared) {
        continue;
      }

      const needUpdate: Set<DataSource> = new Set<DataSource>();
      const isInternal: boolean = isString(descriptor.ref);
      const externalRef: DrawingReference = isInternal ? [sourcePainId, descriptor.ref as DrawingId] : descriptor.ref;
      const internalRef: DrawingReference = isInternal ? descriptor.ref : descriptor.ref[1];

      if (descriptor.options.shareWith) {
        throw new Error('not implemented');
        // for (const pid of descriptor.options.shareWith) {
        //   dataSource = toRaw(this.dataSources.get(pid) as DataSource);
        //   dataSource.externalUpdate(entryRef);
        //   needUpdate.add(dataSource);
        // }
      } else {
        for (const [, ds] of this.dataSources) {
          const currentPaneId: PaneId = this.paneIds.get(ds) as PaneId;
          if (sourcePainId !== currentPaneId) {
            const entryRef = externalRef[0] === currentPaneId ? internalRef : externalRef;
            ds.externalUpdate(entryRef);
            needUpdate.add(ds);
          }
        }
      }

      for (const ds of needUpdate) {
        ds.flush();
      }
    }
  }
}
