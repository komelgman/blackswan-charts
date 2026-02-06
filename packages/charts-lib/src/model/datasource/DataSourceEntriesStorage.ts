import { isString } from 'blackswan-foundation';
import type { DataSourceEntry, DrawingReference } from '@/model/datasource/types';

interface StorageEntry {
  value: DataSourceEntry;
  prev?: StorageEntry;
  next?: StorageEntry;
}

export default class DataSourceEntriesStorage {
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

    const key: string = this.refToMapId(value.descriptor.ref);
    if (this.refToEntry.has(key)) {
      throw new Error(`Entry already exists: ${key}`);
    }

    this.refToEntry.set(key, newEntry);
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

    return this.remove(this.tail.value.descriptor.ref)[0];
  }

  public unshift(value: DataSourceEntry): void {
    if (this.head !== undefined) {
      this.insertBefore(this.head.value.descriptor.ref, value);
    } else {
      this.push(value);
    }
  }

  public shift(): DataSourceEntry {
    if (!this.head) {
      throw new Error('Illegal state: this.head is empty');
    }

    return this.remove(this.head.value.descriptor.ref)[0];
  }

  public insertAfter(target: DrawingReference, value: DataSourceEntry): void {
    const targetEntry = this.refToEntry.get(this.refToMapId(target));
    if (!targetEntry) {
      throw new Error(`Illegal argument: prev entry ref not found: ${target}`);
    }

    const key: string = this.refToMapId(value.descriptor.ref);
    if (this.refToEntry.has(key)) {
      throw new Error(`Entry already exists: ${key}`);
    }

    const nextEntry = targetEntry.next;
    const newEntry: StorageEntry = {
      value,
      prev: targetEntry,
      next: nextEntry,
    };

    if (this.tail === targetEntry) {
      this.tail = newEntry;
    }

    targetEntry.next = newEntry;
    if (nextEntry) {
      nextEntry.prev = newEntry;
    }

    this.refToEntry.set(key, newEntry);
  }

  public insertBefore(target: DrawingReference, value: DataSourceEntry): void {
    const targetEntry = this.refToEntry.get(this.refToMapId(target));
    if (!targetEntry) {
      throw new Error(`Illegal argument: next entry ref not found: ${target}`);
    }

    const key: string = this.refToMapId(value.descriptor.ref);
    if (this.refToEntry.has(key)) {
      throw new Error(`Entry already exists: ${key}`);
    }

    const prevEntry = targetEntry.prev;
    const newEntry: StorageEntry = {
      value,
      prev: prevEntry,
      next: targetEntry,
    };

    if (this.head === targetEntry) {
      this.head = newEntry;
    }

    targetEntry.prev = newEntry;
    if (prevEntry) {
      prevEntry.next = newEntry;
    }

    this.refToEntry.set(key, newEntry);
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

    return [result, tmpPrev ? tmpPrev.value.descriptor.ref : undefined, tmpNext ? tmpNext.value.descriptor.ref : undefined];
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

  public getHeadTailForEntry(entryRef: DrawingReference): [head?: DrawingReference, tail?: DrawingReference] {
    const result: [DrawingReference?, DrawingReference?] = [undefined, undefined];
    const { head, tail } = this;

    if (head === undefined) {
      return result;
    }

    const isInternal = isString(entryRef);

    let entry: StorageEntry | undefined = head;
    if (isInternal) {
      while (entry) {
        const currentRef: DrawingReference = entry.value.descriptor.ref;
        entry = entry.next;
        if (!isString(currentRef)) {
          continue;
        }

        result[0] = currentRef;
        break;
      }

      result[1] = tail?.value.descriptor.ref;
    } else {
      while (entry) {
        const currentRef: DrawingReference = entry.value.descriptor.ref;
        if (isString(currentRef)) {
          break;
        }

        if (entryRef[0] === currentRef[0]) {
          if (result[0] === undefined) {
            result[0] = currentRef;
          }

          result[1] = currentRef;
        }

        entry = entry.next;
      }
    }

    return result;
  }

  private refToMapId(ref: DrawingReference): string {
    return isString(ref) ? ref : `${ref[0]}:${ref[1]}`;
  }
}
