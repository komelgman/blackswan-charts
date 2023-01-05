enum DataSourceChangeEventReason {
  OrderChanged = 'OrderChanged',
  AddEntry = 'AddEntry',
  UpdateEntry = 'UpdateEntry',
  RemoveEntry = 'RemoveEntry',
  CacheReset = 'CacheReset',
  CacheInvalidated = 'CacheInvalidated',
}

export default DataSourceChangeEventReason;
