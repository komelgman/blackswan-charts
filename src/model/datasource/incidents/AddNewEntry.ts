import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DrawingDescriptor } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';

export interface AddNewEntryOptions extends HistoricalIncidentOptions {
  descriptor: DrawingDescriptor<unknown>;
  storage: DataSourceEntriesStorage;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export default class AddNewEntry extends AbstractHistoricalIncident<AddNewEntryOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: AddNewEntryOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { descriptor, addReason, storage } = this.options;
    const newEntry: DataSourceEntry = [descriptor];
    newEntry[0].valid = false;
    const [, tail] = storage.getRange(descriptor.ref);

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
