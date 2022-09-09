import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { DrawingReference } from '@/model/datasource/Drawing';

export interface StorageEntry {
  value: DataSourceEntry;
  prev?: StorageEntry;
  next?: StorageEntry;
}

export default class DataSourceStorage {
  private readonly refToEntry: Map<DrawingReference, StorageEntry>;
  public head: StorageEntry | undefined;
  public tail: StorageEntry | undefined;

  constructor() {
    this.refToEntry = new Map();
  }

  public push(value: DataSourceEntry): void {
    const newEntry: StorageEntry = {
      value,
      prev: this.head,
    };

    this.refToEntry.set(newEntry.value[0].ref, newEntry);
    if (!this.head) {
      this.head = newEntry;
    }

    if (this.tail) {
      this.tail.next = newEntry;
      newEntry.prev = this.tail;
    }

    this.tail = newEntry;
  }

  public insertAfter(prevEntry: StorageEntry, entry: DataSourceEntry): void {
    // todo
  }

  public insertBefore(nextEntry: StorageEntry, entry: DataSourceEntry): void {
    // todo
  }

  public pop(): DataSourceEntry {
    if (this.tail == null) {
      throw new Error('Illegal state: this.tail == null');
    }

    return this.remove(this.tail.value[0].ref)[0];
  }

  public remove(ref: DrawingReference): [DataSourceEntry, StorageEntry?, StorageEntry?] {
    const tmp = this.refToEntry.get(ref);
    if (!tmp) {
      throw new Error(`Illegal state: no ref found ${ref}`);
    }

    const result = tmp.value;
    this.refToEntry.delete(ref);

    const tmpPrev = tmp.prev;
    if (tmpPrev) {
      tmpPrev.next = undefined;
    }

    const tmpNext = tmp.next;
    if (tmpNext) {
      tmpNext.prev = undefined;
    }

    tmp.prev = undefined;
    tmp.next = undefined;

    if (tmp === this.tail) {
      this.tail = tmpPrev;
    }

    if (tmp === this.head) {
      this.head = tmpNext;
    }

    return [result, tmpPrev, tmpNext];
  }

  public has(ref: DrawingReference): boolean {
    return this.refToEntry.has(ref);
  }

  public get(ref: DrawingReference): DataSourceEntry {
    const storageEntry: StorageEntry | undefined = this.refToEntry.get(ref);
    if (storageEntry === undefined) {
      throw new Error(`Illegal argument: ref not found${ref}`);
    }

    return storageEntry.value;
  }
}
