import { beforeEach, describe, it, expect } from 'vitest';

import DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/types';

describe('DataSourceEntriesStorage', () => {
  let storage: DataSourceEntriesStorage;
  const entry1: DataSourceEntry<string> = {
    descriptor: {
      ref: 'e1',
      options: {
        id: 'e1',
        data: 'test entry1',
        type: 't1',
        locked: false,
        visible: true,
      },
    },
  };

  const entry2: DataSourceEntry<string> = {
    descriptor: {
      ref: 'e2',
      options: {
        id: 'e2',
        data: 'test entry2',
        type: 't1',
        locked: false,
        visible: true,
      },
    },
  };

  const entry3: DataSourceEntry<string> = {
    descriptor: {
      ref: 'e3',
      options: {
        id: 'e3',
        data: 'test entry3',
        type: 't1',
        locked: false,
        visible: true,
      },
    },
  };

  function getDataSourceEntries(): DataSourceEntry[] {
    const result: DataSourceEntry[] = [];
    let item = storage.head;
    while (item !== undefined) {
      result.push(item.value);
      item = item.next;
    }

    return result;
  }

  function getDataSourceInvertedEntries(): DataSourceEntry[] {
    const result: DataSourceEntry[] = [];
    let item = storage.tail;
    while (item !== undefined) {
      result.push(item.value);
      item = item.prev;
    }

    return result;
  }

  beforeEach(async () => {
    storage = new DataSourceEntriesStorage();
  });

  it('push/pop entry', () => {
    storage.push(entry1);

    expect(getDataSourceEntries()).toEqual([entry1]);

    storage.push(entry2);
    storage.push(entry3);

    expect(() => storage.push(entry3)).toThrowError(/^Entry already exists: e3/);
    expect(getDataSourceEntries()).toEqual([entry1, entry2, entry3]);
    expect(getDataSourceInvertedEntries()).toEqual([entry3, entry2, entry1]);
    expect(storage.head?.value).toEqual(entry1);
    expect(storage.tail?.value).toEqual(entry3);

    const popped: DataSourceEntry = storage.pop();

    expect(popped).toEqual(entry3);
    expect(getDataSourceEntries()).toEqual([entry1, entry2]);
    expect(getDataSourceInvertedEntries()).toEqual([entry2, entry1]);
    expect(storage.head?.value).toEqual(entry1);
    expect(storage.tail?.value).toEqual(entry2);
  });

  it('shift/unshift entry', () => {
    storage.push(entry1);
    storage.push(entry2);

    storage.unshift(entry3);
    expect(getDataSourceEntries()).toEqual([entry3, entry1, entry2]);
    expect(getDataSourceInvertedEntries()).toEqual([entry2, entry1, entry3]);
    expect(storage.head?.value).toEqual(entry3);
    expect(storage.tail?.value).toEqual(entry2);

    expect(() => storage.unshift(entry1)).toThrowError(/^Entry already exists: e1/);
    expect(getDataSourceEntries()).toEqual([entry3, entry1, entry2]);
    expect(getDataSourceInvertedEntries()).toEqual([entry2, entry1, entry3]);
    expect(storage.head?.value).toEqual(entry3);
    expect(storage.tail?.value).toEqual(entry2);

    const shifted: DataSourceEntry = storage.shift();
    expect(shifted).toEqual(entry3);
    expect(getDataSourceEntries()).toEqual([entry1, entry2]);
    expect(getDataSourceInvertedEntries()).toEqual([entry2, entry1]);
    expect(storage.head?.value).toEqual(entry1);
    expect(storage.tail?.value).toEqual(entry2);
  });

  it('insertBefore entry', () => {
    expect(() => storage.insertBefore('ref', entry1)).toThrowError(/^Illegal argument: next entry ref not found: ref/);

    storage.push(entry1);
    expect(() => storage.insertBefore('e1', entry1)).toThrowError(/^Entry already exists: e1/);
    expect(getDataSourceEntries()).toEqual([entry1]);
    expect(getDataSourceInvertedEntries()).toEqual([entry1]);
    expect(storage.head?.value).toEqual(entry1);
    expect(storage.tail?.value).toEqual(entry1);

    storage.insertBefore('e1', entry2);
    storage.insertBefore('e1', entry3);
    expect(getDataSourceEntries()).toEqual([entry2, entry3, entry1]);
    expect(getDataSourceInvertedEntries()).toEqual([entry1, entry3, entry2]);
    expect(storage.head?.value).toEqual(entry2);
    expect(storage.tail?.value).toEqual(entry1);
  });

  it('insertAfter entry', () => {
    expect(() => storage.insertAfter('ref', entry1)).toThrowError(/^Illegal argument: prev entry ref not found: ref/);

    storage.push(entry1);
    expect(() => storage.insertAfter('e1', entry1)).toThrowError(/^Entry already exists: e1/);
    expect(getDataSourceEntries()).toEqual([entry1]);
    expect(storage.head?.value).toEqual(entry1);
    expect(storage.tail?.value).toEqual(entry1);

    storage.insertAfter('e1', entry2);
    storage.insertAfter('e1', entry3);
    expect(getDataSourceEntries()).toEqual([entry1, entry3, entry2]);
    expect(getDataSourceInvertedEntries()).toEqual([entry2, entry3, entry1]);
    expect(storage.head?.value).toEqual(entry1);
    expect(storage.tail?.value).toEqual(entry2);
  });

  it('has/get entry', () => {
    storage.push(entry1);
    storage.push(entry2);
    storage.push(entry3);

    expect(storage.has(entry1.descriptor.ref)).toBeTruthy();
    expect(storage.has(entry2.descriptor.ref)).toBeTruthy();
    expect(storage.has(entry3.descriptor.ref)).toBeTruthy();
    expect(storage.has('wrongref')).toBeFalsy();

    expect(storage.get(entry1.descriptor.ref)).toEqual(entry1);
    expect(storage.get(entry2.descriptor.ref)).toEqual(entry2);
    expect(storage.get(entry3.descriptor.ref)).toEqual(entry3);
    expect(() => storage.get('wrongref')).toThrowError(/^Illegal argument: ref not found: wrongref/);
  });
});
