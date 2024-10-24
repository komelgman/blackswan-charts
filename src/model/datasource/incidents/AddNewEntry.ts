import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import { DataSourceChangeEventReason } from '@/model/datasource/events';
import type { DataSourceEntry, DrawingDescriptor } from '@/model/datasource/types';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface AddNewEntryOptions extends HistoricalIncidentOptions {
  descriptor: DrawingDescriptor;
  storage: DataSourceEntriesStorage;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export class AddNewEntry extends AbstractHistoricalIncident<AddNewEntryOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: AddNewEntryOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { descriptor, addReason, storage } = this.options;
    const newEntry: DataSourceEntry = { descriptor };
    newEntry.descriptor.valid = false;
    const [, tail] = storage.getHeadTailForEntry(descriptor.ref);

    if (tail) {
      storage.insertAfter(tail, newEntry);
    } else {
      storage.unshift(newEntry);
    }

    addReason(DataSourceChangeEventReason.AddEntry, [newEntry]);
  }

  protected inverseIncident(): void {
    const { addReason, storage } = this.options;
    const deletedEntry: DataSourceEntry = storage.pop();

    addReason(DataSourceChangeEventReason.RemoveEntry, [deletedEntry]);
  }
}
