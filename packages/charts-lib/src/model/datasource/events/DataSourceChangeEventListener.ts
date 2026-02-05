import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceChangeEvent, DataSourceChangeEventReason } from '@/model/datasource/events';

export declare type DataSourceChangeEventsMap = Map<DataSourceChangeEventReason, DataSourceChangeEvent[]>;
export declare type DataSourceChangeEventListener = (events: DataSourceChangeEventsMap, ds: DataSource) => void;
