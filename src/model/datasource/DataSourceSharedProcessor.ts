import type { PaneId } from '@/components/layout/PaneDescriptor';
import { isString } from '@/misc/strict-type-checks';
import type DataSource from '@/model/datasource/DataSource';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { StorageEntry } from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingReference } from '@/model/datasource/Drawing';

export default class DataSourceSharedProcessor {
  public readonly dataSource: DataSource;
  private readonly storage: DataSourceEntriesStorage;
  private readonly addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
  private paneIdValue?: PaneId;

  public constructor(
    dataSource: DataSource,
    storage: DataSourceEntriesStorage,
    addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void,
  ) {
    this.dataSource = dataSource;
    this.storage = storage;
    this.addReason = addReason;
  }

  public get paneId(): PaneId {
    if (this.paneIdValue === undefined) {
      throw new Error('Illegal state: paneId not initialized');
    }

    return this.paneIdValue;
  }

  public set paneId(value: PaneId | undefined) {
    if (this.paneIdValue !== undefined) {
      throw new Error('Illegal state: paneId already initialized');
    }

    this.paneIdValue = value;
  }

  * shared(external: PaneId): IterableIterator<Readonly<DataSourceEntry>> {
    // this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      const entryValue: DataSourceEntry = entry.value;
      const [descriptor] = entryValue;
      const { shareWith } = descriptor.options;

      if (isString(descriptor.ref) && (shareWith === '*' || (shareWith !== undefined && shareWith.indexOf(external) > -1))) {
        yield entryValue;
      }

      entry = entry.next;
    }
  }

  public attachExternalEntries(paneId: PaneId, entries: IterableIterator<Readonly<DataSourceEntry<unknown>>>): void {
    // this.checkWeAreNotInProxy();

    for (const entry of entries) {
      this.storage.unshift(this.createExternalEntry(paneId, entry));
    }
  }

  public detachExternalEntries(paneId: PaneId): void {
    // this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      const [descriptor] = entry.value;
      if (isString(descriptor.ref)) {
        break;
      }

      if (descriptor.ref[0] === paneId) {
        this.storage.remove(descriptor.ref);
      }

      entry = entry.next;
    }
  }

  public sharedUpdate(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.get(ref);
    entry[0].valid = false;
    this.addReason(DataSourceChangeEventReason.UpdateSharedEntry, [entry]);
  }

  public sharedAddEntry(paneId: PaneId, entry: Readonly<DataSourceEntry<unknown>>) {
    const { storage } = this;
    const [, paneTail] = this.getExternalPaneRange(paneId);
    const externalEntry = this.createExternalEntry(paneId, entry);

    if (paneTail) {
      storage.insertAfter(paneTail, externalEntry);
    } else {
      storage.unshift(externalEntry);
    }

    this.addReason(DataSourceChangeEventReason.UpdateSharedEntry, [externalEntry]);
  }

  private getExternalPaneRange(paneId: PaneId): [DrawingReference?, DrawingReference?] {
    const { storage } = this;
    if (storage.head === undefined) {
      return [];
    }

    let entry: StorageEntry | undefined = storage.head;
    let paneHead: DrawingReference | undefined;
    let paneTail: DrawingReference | undefined;

    while (entry) {
      const entryRef: DrawingReference = entry.value[0].ref;
      if (isString(entryRef)) {
        break;
      }

      if (entryRef[0] === paneId) {
        if (paneHead === undefined) {
          paneHead = entry.value[0].ref;
        }

        paneTail = entry.value[0].ref;
      }

      entry = entry.next;
    }

    return [paneHead, paneTail];
  }

  private createExternalEntry(paneId: PaneId, externalEntry: Readonly<DataSourceEntry>): DataSourceEntry {
    const [externalDescriptor] = externalEntry;
    if (!isString(externalDescriptor.ref)) {
      throw new Error('Illegal argument: external entry cant be shared');
    }

    return [{
      ref: [paneId, externalDescriptor.ref],
      options: externalDescriptor.options,
    }];
  }
}
