enum DataSourceChangeEventReason {
  OrderChanged = 'OrderChanged',
  AddEntry = 'AddEntry',
  UpdateEntry = 'UpdateEntry',
  RemoveEntry = 'RemoveEntry',
  DataInvalid = 'DataInvalid',
  CacheReset = 'CacheReset',
  CacheInvalidated = 'CacheInvalidated',
}

export default DataSourceChangeEventReason;
