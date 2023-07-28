import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DrawingReference } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';

export interface RemoveEntryOptions extends HistoricalIncidentOptions {
  ref: DrawingReference;
  storage: DataSourceEntriesStorage;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export default class RemoveEntry extends AbstractHistoricalIncident<RemoveEntryOptions> {
  private removedEntry!: [DataSourceEntry, DrawingReference?, DrawingReference?];

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: RemoveEntryOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { ref, storage, addReason } = this.options;

    this.removedEntry = storage.remove(ref);

    addReason(DataSourceChangeEventReason.RemoveEntry, [this.removedEntry[0]]);
  }

  protected inverseIncident(): void {
    const { storage, addReason } = this.options;
    const [entry, prevRef, nextRef] = this.removedEntry;

    entry.descriptor.valid = false;

    if (prevRef) {
      storage.insertAfter(prevRef, entry);
    } else if (nextRef) {
      storage.insertBefore(nextRef, entry);
    } else {
      storage.push(entry);
    }

    addReason(DataSourceChangeEventReason.AddEntry, [entry]);
  }
}
