import { isString } from '@/misc/strict-type-checks';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { DrawingReference } from '@/model/datasource/Drawing';

export interface StorageEntry {
  value: DataSourceEntry;
  prev?: StorageEntry;
  next?: StorageEntry;
}

export default class DataSourceStorage {
  private readonly refToEntry: Map<string, StorageEntry>;
  public head: StorageEntry | undefined;
  public tail: StorageEntry | undefined;

  constructor() {
    this.refToEntry = new Map();
  }

  public push(value: DataSourceEntry): void {
    const newEntry: StorageEntry = {
      value,
    };

    this.refToEntry.set(this.refToMapId(newEntry.value[0].ref), newEntry);
    if (!this.head) {
      this.head = newEntry;
    }

    if (this.tail) {
      this.tail.next = newEntry;
      newEntry.prev = this.tail;
    }

    this.tail = newEntry;
  }

  public pop(): DataSourceEntry {
    if (!this.tail) {
      throw new Error('Illegal state: this.tail is empty');
    }

    return this.remove(this.tail.value[0].ref)[0];
  }

  public unshift(value: DataSourceEntry): void {
    const newEntry: StorageEntry = {
      value,
    };

    this.refToEntry.set(this.refToMapId(newEntry.value[0].ref), newEntry);
    if (!this.tail) {
      this.tail = newEntry;
    }

    if (this.head) {
      this.head.prev = newEntry;
      newEntry.next = this.head;
    }

    this.head = newEntry;
  }

  public shift(): DataSourceEntry {
    if (!this.head) {
      throw new Error('Illegal state: this.head is empty');
    }

    return this.remove(this.head.value[0].ref)[0];
  }

  public insertAfter(prevEntry: StorageEntry, entry: DataSourceEntry): void {
    const nextEntry = prevEntry.next;
    const newEntry: StorageEntry = {
      value: entry,
      prev: prevEntry,
      next: nextEntry,
    }

    prevEntry.next = newEntry;
    if (nextEntry) {
      newEntry.prev = newEntry;
    }

    if (this.tail === prevEntry) {
      this.tail = newEntry;
    }

    this.refToEntry.set(this.refToMapId(entry[0].ref), newEntry);
  }

  public insertBefore(nextEntry: StorageEntry, entry: DataSourceEntry): void {
    const prevEntry = nextEntry.prev;
    const newEntry: StorageEntry = {
      value: entry,
      prev: prevEntry,
      next: nextEntry,
    }

    nextEntry.prev = newEntry;
    if (prevEntry) {
      prevEntry.next = newEntry;
    }

    if (this.head === nextEntry) {
      this.head = newEntry;
    }

    this.refToEntry.set(this.refToMapId(entry[0].ref), newEntry);
  }

  public remove(ref: DrawingReference): [DataSourceEntry, Readonly<StorageEntry>?, Readonly<StorageEntry>?] {
    const key: string = this.refToMapId(ref);
    const tmp = this.refToEntry.get(key);

    if (!tmp) {
      throw new Error(`Illegal state: no ref found ${ref}`);
    }

    const result = tmp.value;
    this.refToEntry.delete(key);

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
    return this.refToEntry.has(this.refToMapId(ref));
  }

  public get(ref: DrawingReference): DataSourceEntry {
    const storageEntry: StorageEntry | undefined = this.refToEntry.get(this.refToMapId(ref));
    if (storageEntry === undefined) {
      throw new Error(`Illegal argument: ref not found: ${ref}`);
    }

    return storageEntry.value;
  }

  private refToMapId(ref: DrawingReference): string {
    return isString(ref) ? ref : `${ref[0]}:${ref[1]}`;
  }
}
