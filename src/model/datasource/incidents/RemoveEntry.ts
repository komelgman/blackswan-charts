import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import DataSourceStorage, { StorageEntry } from '@/model/datasource/DataSourceStorage';
import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';

export interface RemoveEntryOptions extends HistoricalIncidentOptions {
  entry: DataSourceEntry;
  storage: DataSourceStorage;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export default class RemoveEntry extends AbstractHistoricalIncident<RemoveEntryOptions> {
  private removedEntry!: [DataSourceEntry, StorageEntry?, StorageEntry?];

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: RemoveEntryOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { entry, storage, addReason } = this.options;

    this.removedEntry = storage.remove(entry[0].ref);

    addReason(DataSourceChangeEventReason.RemoveEntry, [entry]);
  }

  protected inverseIncident(): void {
    const { storage, addReason } = this.options;
    const [entry, prevEntry, nextEntry] = this.removedEntry;

    if (prevEntry) {
      storage.insertAfter(prevEntry, entry);
    } else if (nextEntry) {
      storage.insertBefore(nextEntry, entry);
    } else {
      storage.push(entry);
    }

    addReason(DataSourceChangeEventReason.AddEntry, [entry]);
  }
}
