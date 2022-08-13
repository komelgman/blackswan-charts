import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';

export default interface DataSourceChangeEventListener {
  (reasons: Set<DataSourceChangeEventReason>): void;
}
