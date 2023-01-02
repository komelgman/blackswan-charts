import type DataSource from '@/model/datasource/DataSource';
import type DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';

export interface DataSourceChangeEvent {
  reason: DataSourceChangeEventReason,
  shared: boolean,
  entry: DataSourceEntry
}

export declare type DataSourceChangeEventsMap = Map<DataSourceChangeEventReason, DataSourceChangeEvent[]>;

export default interface DataSourceChangeEventListener {
  (events: DataSourceChangeEventsMap, ds: DataSource): void;
}
