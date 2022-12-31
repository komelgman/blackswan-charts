enum DataSourceChangeEventReason {
  OrderChanged,
  AddEntry,
  UpdateEntry,
  UpdateSharedEntry, // prevent recursive update call
  RemoveEntry,
  CacheReset,
  CacheInvalidated,
}

export default DataSourceChangeEventReason;
