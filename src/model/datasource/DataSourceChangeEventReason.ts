enum DataSourceChangeEventReason {
  OrderChanged,
  AddEntry,
  UpdateEntry,
  ExternalUpdateEntry,
  RemoveEntry,
  CacheReset,
  CacheInvalidated
}

export default DataSourceChangeEventReason;
