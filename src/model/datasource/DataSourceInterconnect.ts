import { PaneId } from '@/components/layout/PaneDescriptor';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import DataSourceChangeEventListener, {
  ChangeReasons,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { toRaw } from 'vue';

export default class DataSourceInterconnect {
  private readonly dataSources: Map<PaneId, DataSource> = new Map();

  public addDataSource(paneId: PaneId, dataSource: DataSource): void {
    if (this.dataSources.has(paneId)) {
      throw new Error(`Illegal state: dataSource with paneId=${paneId} already exists`);
    }

    this.dataSources.set(paneId, dataSource);
    const rawDS: DataSource = toRaw(dataSource);
    rawDS.interconnect = this;
    rawDS.addChangeEventListener(this.dataSourceChangeEventListener);

    // populate all other
    // populate datasource
  }

  public removeDataSource(paneId: PaneId): void {
    if (!this.dataSources.has(paneId)) {
      throw new Error(`Illegal state: dataSource with paneId=${paneId} doesn''t exists`);
    }

    const dataSource: DataSource = this.dataSources.get(paneId) as DataSource;
    dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
    this.dataSources.delete(paneId);

    // depopulate datasource
    // depopulate all other
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: ChangeReasons, ds?: DataSource): void => {
    // in case when shared element can change shareWith or share state we should
    // think about new change reason
    if (reasons.has(DataSourceChangeEventReason.AddEntry)) {
      const newEntries: DataSourceEntry[] = reasons.get(DataSourceChangeEventReason.AddEntry) as DataSourceEntry[];
      for (const [newEntryDescriptor] of newEntries) {
        if (!isString(newEntryDescriptor.ref)) {
          throw new Error('Illegal state: oops');
        }

        if (!newEntryDescriptor.options.shared) {
          continue;
        }

        console.log('new shared element'); // todo: !!
      }
    }

    if (reasons.has(DataSourceChangeEventReason.RemoveEntry)) {
      console.log('remove entry');
    }

    if (reasons.has(DataSourceChangeEventReason.UpdateEntry)) {
      console.log('update entry');
    }
  };
}
