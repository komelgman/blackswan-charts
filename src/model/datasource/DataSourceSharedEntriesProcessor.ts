import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceId } from '@/model/datasource/DataSource';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { StorageEntry } from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingReference } from '@/model/datasource/Drawing';

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
      const [descriptor] = entryValue;
      const { shareWith } = descriptor.options;

      if (isString(descriptor.ref) && (shareWith === '*' || (shareWith !== undefined && shareWith.indexOf(externalDataSourceId) > -1))) {
        yield entryValue;
      }

      entry = entry.next;
    }
  }

  public attachSharedEntriesFrom(sourceDataSource: DataSource): void {
    // this.checkWeAreNotInProxy();

    const { storage } = this;
    const headref = storage.head;
    for (const entry of sourceDataSource.sharedProcessor.shared(this.dataSource.id)) {
      if (headref === undefined) {
        storage.push(this.createExternalEntry(sourceDataSource.id, entry));
      } else {
        storage.insertBefore(headref.value[0].ref, this.createExternalEntry(sourceDataSource.id, entry));
      }
    }
  }

  public detachSharedEntries(dsId: DataSourceId): void {
    // this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      const [descriptor] = entry.value;
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
    entry[0].valid = false;
    this.addReason(DataSourceChangeEventReason.UpdateEntry, [entry], true);
  }

  public addEntry(dsId: DataSourceId, entry: Readonly<DataSourceEntry<unknown>>) {
    const { storage } = this;
    const [, tail] = this.getRangeForExternalDS(dsId);
    const externalEntry = this.createExternalEntry(dsId, entry);

    if (tail) {
      storage.insertAfter(tail, externalEntry);
    } else {
      storage.unshift(externalEntry);
    }

    this.addReason(DataSourceChangeEventReason.AddEntry, [externalEntry], true);
  }

  public removeEntry(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.remove(ref)[0];
    this.addReason(DataSourceChangeEventReason.RemoveEntry, [entry], true);
  }

  private getRangeForExternalDS(dsId: DataSourceId): [DrawingReference?, DrawingReference?] {
    const { storage } = this;
    if (storage.head === undefined) {
      return [];
    }

    let entry: StorageEntry | undefined = storage.head;
    let head: DrawingReference | undefined;
    let tail: DrawingReference | undefined;

    while (entry) {
      const entryRef: DrawingReference = entry.value[0].ref;
      if (isString(entryRef)) {
        break;
      }

      if (entryRef[0] === dsId) {
        if (head === undefined) {
          head = entry.value[0].ref;
        }

        tail = entry.value[0].ref;
      }

      entry = entry.next;
    }

    return [head, tail];
  }

  private createExternalEntry(dsId: DataSourceId, externalEntry: Readonly<DataSourceEntry>): DataSourceEntry {
    const [externalDescriptor] = externalEntry;
    if (!isString(externalDescriptor.ref)) {
      throw new Error('Illegal argument: external entry cant be shared');
    }

    return [{
      ref: [dsId, externalDescriptor.ref],
      options: externalDescriptor.options,
    }];
  }
}
