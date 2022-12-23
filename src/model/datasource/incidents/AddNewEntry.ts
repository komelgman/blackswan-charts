import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type DataSourceStorage from '@/model/datasource/DataSourceStorage';
import type { DrawingDescriptor } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';

export interface AddNewEntryOptions extends HistoricalIncidentOptions {
  descriptor: DrawingDescriptor<unknown>;
  storage: DataSourceStorage;
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

    descriptor.valid = false;
    storage.push(newEntry);

    addReason(DataSourceChangeEventReason.AddEntry, [newEntry]);
  }

  protected inverseIncident(): void {
    const { addReason, storage } = this.options;
    const deletedEntry: DataSourceEntry = storage.pop();

    addReason(DataSourceChangeEventReason.RemoveEntry, [deletedEntry]);
  }
}
