enum DataSourceChangeEventReason {
  OrderChanged = 'OrderChanged',
  AddEntry = 'AddEntry',
  UpdateEntry = 'UpdateEntry',
  DataInvalid = 'DataInvalid',
  RemoveEntry = 'RemoveEntry',
  CacheReset = 'CacheReset',
  CacheInvalidated = 'CacheInvalidated',
  PrimaryResourceChanged = 'PrimaryResourceChanged',
}

export default DataSourceChangeEventReason;
