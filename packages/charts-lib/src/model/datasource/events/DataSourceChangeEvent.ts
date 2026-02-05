import type { DataSourceChangeEventReason } from '@/model/datasource/events';
import type { DataSourceEntry } from '@/model/datasource/types';

export interface DataSourceChangeEvent {
  reason: DataSourceChangeEventReason,
  shared: boolean,
  entry: DataSourceEntry
}
