export interface CanMergeWith<T> {
  mergeWith(op: T): boolean;
}
