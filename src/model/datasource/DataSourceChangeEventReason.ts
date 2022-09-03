enum DataSourceChangeEventReason {
  OrderChanged,
  AddEntry,
  UpdateEntry,
  RemoveEntry,
  CacheReset,
  CacheInvalidated,
  PriceMarkInvalidated,
  TransactionStart,
  TransactionEnd,
  TransactionCancelled
}

export default DataSourceChangeEventReason;
