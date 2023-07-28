import { clone, isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceId } from '@/model/datasource/DataSource';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingOptions, DrawingReference } from '@/model/datasource/Drawing';

export default class DataSourceSharedEntriesProcessor {
  public readonly dataSource: DataSource;
  private readonly storage: DataSourceEntriesStorage;
  private readonly addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[], shared: boolean) => void;

  public constructor(
    dataSource: DataSource,
    storage: DataSourceEntriesStorage,
    addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void,
  ) {
    this.dataSource = dataSource;
    this.storage = storage;
    this.addReason = addReason.bind(dataSource);
  }

  * shared(externalDataSourceId: DataSourceId): IterableIterator<Readonly<DataSourceEntry>> {
    // this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      const entryValue: DataSourceEntry = entry.value;
      const { descriptor } = entryValue;
      const { shareWith } = descriptor.options;

      if (isString(descriptor.ref) && (shareWith === '*' || (shareWith !== undefined && shareWith.indexOf(externalDataSourceId) > -1))) {
        yield entryValue;
      }

      entry = entry.next;
    }
  }

  public attachSharedEntriesFrom(source: DataSource): void {
    // this.checkWeAreNotInProxy();

    const { storage } = this;
    const headref = storage.head?.value.descriptor.ref;
    for (const entry of source.sharedProcessor.shared(this.dataSource.id)) {
      const { ref, options } = entry.descriptor;
      if (!isString(ref)) {
        throw new Error('Illegal state: try to attach external entry as shared');
      }

      const newEntry: DataSourceEntry = this.createEntry([source.id, ref], options);
      if (headref === undefined) {
        storage.push(newEntry);
      } else {
        storage.insertBefore(headref, newEntry);
      }
    }
  }

  public detachSharedEntries(dsId: DataSourceId): void {
    // this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      const { descriptor } = entry.value;
      if (isString(descriptor.ref)) {
        break;
      }

      entry = entry.next;
      if (descriptor.ref[0] === dsId) {
        this.storage.remove(descriptor.ref); // todo add method removeEntry
      }
    }
  }

  public update(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.get(ref);
    entry.descriptor.valid = false;
    this.addReason(DataSourceChangeEventReason.UpdateEntry, [entry], true);
  }

  public addEntry(entryRef: DrawingReference, options: Omit<DrawingOptions, 'id'>) {
    const { storage } = this;
    const [, tail] = storage.getRange(entryRef);
    const entry = this.createEntry(entryRef, options);

    if (tail) {
      storage.insertAfter(tail, entry);
    } else {
      storage.unshift(entry);
    }

    this.addReason(DataSourceChangeEventReason.AddEntry, [entry], true);
  }

  public removeEntry(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.remove(ref)[0];
    this.addReason(DataSourceChangeEventReason.RemoveEntry, [entry], true);
  }

  private createEntry(ref: DrawingReference, options: Omit<DrawingOptions, 'id'>): DataSourceEntry {
    if (isString(ref)) {
      return { descriptor: { ref, options } };
    }

    if (ref[0] === this.dataSource.id) {
      throw new Error('Illegal argument: ref[0] === this.dataSource.id');
    }

    return { descriptor: { ref: clone(ref), options } };
  }
}
