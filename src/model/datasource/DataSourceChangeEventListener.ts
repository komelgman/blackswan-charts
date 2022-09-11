import type DataSource from '@/model/datasource/DataSource';
import type DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';

export declare type ChangeReasons = Map<DataSourceChangeEventReason, DataSourceEntry[]>;

export default interface DataSourceChangeEventListener {
  (reasons: ChangeReasons, ds: DataSource): void;
}
