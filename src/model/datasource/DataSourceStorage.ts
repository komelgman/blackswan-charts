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

    console.debug('DataSourceStorage.push', value[0].ref);

    this.tail = newEntry;
  }

  public pop(): DataSourceEntry {
    if (!this.tail) {
      throw new Error('Illegal state: this.tail is empty');
    }

    console.debug('DataSourceStorage.pop', this.tail.value[0].ref);

    return this.remove(this.tail.value[0].ref)[0];
  }

  public unshift(value: DataSourceEntry): void {
    if (this.head !== undefined) {
      this.insertBefore(this.head.value[0].ref, value);
    } else {
      this.push(value);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.debug('DataSourceStorage.unshift (add head) entry', this.head.value[0].ref);
  }

  public shift(): DataSourceEntry {
    if (!this.head) {
      throw new Error('Illegal state: this.head is empty');
    }

    console.debug('DataSourceStorage.shift (delete head) entry', this.head.value[0].ref);

    return this.remove(this.head.value[0].ref)[0];
  }

  public insertAfter(prev: DrawingReference, entry: DataSourceEntry): void {
    const prevEntry = this.refToEntry.get(this.refToMapId(prev));
    if (!prevEntry) {
      throw new Error(`Illegal argument: prev ref not found: ${prev}`);
    }

    const nextEntry = prevEntry.next;
    const newEntry: StorageEntry = {
      value: entry,
      prev: prevEntry,
      next: nextEntry,
    }

    if (this.tail === prevEntry) {
      this.tail = newEntry;
    }

    prevEntry.next = newEntry;
    if (nextEntry) {
      newEntry.prev = newEntry;
    }

    console.debug('DataSourceStorage.insertAfter', newEntry);

    this.refToEntry.set(this.refToMapId(entry[0].ref), newEntry);
  }

  public insertBefore(next: DrawingReference, entry: DataSourceEntry): void {
    const nextEntry = this.refToEntry.get(this.refToMapId(next));
    if (!nextEntry) {
      throw new Error(`Illegal argument: prev ref not found: ${next}`);
    }

    const prevEntry = nextEntry.prev;
    const newEntry: StorageEntry = {
      value: entry,
      prev: prevEntry,
      next: nextEntry,
    }

    if (this.head === nextEntry) {
      this.head = newEntry;
    }

    nextEntry.prev = newEntry;
    if (prevEntry) {
      prevEntry.next = newEntry;
    }

    console.debug('DataSourceStorage.insertBefore', [newEntry, this.head, this.tail]);

    this.refToEntry.set(this.refToMapId(entry[0].ref), newEntry);
  }

  public remove(ref: DrawingReference): [DataSourceEntry, DrawingReference?, DrawingReference?] {
    const key: string = this.refToMapId(ref);
    const tmp = this.refToEntry.get(key);

    if (!tmp) {
      throw new Error(`Illegal state: no ref found ${ref}`);
    }

    const result = tmp.value;
    this.refToEntry.delete(key);

    const tmpPrev = tmp.prev;
    const tmpNext = tmp.next;

    if (tmpPrev) {
      tmpPrev.next = tmpNext;
    }

    if (tmpNext) {
      tmpNext.prev = tmpPrev;
    }

    if (tmp === this.tail) {
      this.tail = tmpPrev;
    }

    if (tmp === this.head) {
      this.head = tmpNext;
    }

    tmp.prev = undefined;
    tmp.next = undefined;

    console.debug('DataSourceStorage.remove', ref);

    return [result, tmpPrev ? tmpPrev.value[0].ref : undefined, tmpNext ? tmpNext.value[0].ref : undefined];
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
