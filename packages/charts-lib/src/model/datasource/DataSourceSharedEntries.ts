import { clone, isString, NonReactive } from '@blackswan/foundation';
import type DataSource from '@/model/datasource/DataSource';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import { DataSourceChangeEventReason } from '@/model/datasource/events';
import type { DataSourceEntry, DataSourceId, DrawingOptions, DrawingReference } from '@/model/datasource/types';
@NonReactive
export default class DataSourceSharedEntries {
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

  * sharedWith(externalDataSourceId: DataSourceId): IterableIterator<Readonly<DataSourceEntry>> {
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
    const { storage } = this;
    const headref = storage.head?.value.descriptor.ref;
    for (const entry of source.sharedEntries.sharedWith(this.dataSource.id)) {
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
    let entry = this.storage.head;
    while (entry !== undefined) {
      const { descriptor } = entry.value;
      if (isString(descriptor.ref)) {
        break;
      }

      entry = entry.next;
      if (descriptor.ref[0] === dsId) {
        this.storage.remove(descriptor.ref);
      }
    }
  }

  public update(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.get(ref);
    entry.descriptor.valid = false;
    this.addReason(DataSourceChangeEventReason.UpdateEntry, [entry], true);
  }

  public addEntry(entryRef: DrawingReference, options: DrawingOptions) {
    const { storage } = this;
    const [, tail] = storage.getHeadTailForEntry(entryRef);
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

  public requestDataUpdate(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.get(ref);
    this.addReason(DataSourceChangeEventReason.DataInvalid, [entry], true);
  }

  private createEntry(ref: DrawingReference, options: DrawingOptions): DataSourceEntry {
    if (isString(ref)) {
      return { descriptor: { ref, options } };
    }

    if (ref[0] === this.dataSource.id) {
      throw new Error('Illegal argument: ref[0] === this.dataSource.id');
    }

    return { descriptor: { ref: clone(ref), options } };
  }
}
