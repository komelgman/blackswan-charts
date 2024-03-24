import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DrawingDescriptor } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';

export interface AddNewEntryOptions extends HistoricalIncidentOptions {
  descriptor: DrawingDescriptor<unknown>;
  storage: DataSourceEntriesStorage;
  entriesThatUsedDataProvider: Map<string, DataSourceEntry[]>;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export default class AddNewEntry extends AbstractHistoricalIncident<AddNewEntryOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: AddNewEntryOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { descriptor, addReason, storage, entriesThatUsedDataProvider } = this.options;
    const newEntry: DataSourceEntry = { descriptor };
    newEntry.descriptor.valid = false;
    const [, tail] = storage.getHeadTailForEntry(descriptor.ref);

    const dataProvider: string = newEntry.descriptor.options.data.dataProvider;
    if (dataProvider !== undefined) {
      let entries: DataSourceEntry[] | undefined = entriesThatUsedDataProvider.get(dataProvider);
      if (entries === undefined) {
        entries = [];
        entriesThatUsedDataProvider.set(dataProvider, entries);
      }

      entries.push(newEntry);
    }

    if (tail) {
      storage.insertAfter(tail, newEntry);
    } else {
      storage.unshift(newEntry);
    }

    addReason(DataSourceChangeEventReason.AddEntry, [newEntry]);
  }

  protected inverseIncident(): void {
    const { addReason, storage, entriesThatUsedDataProvider } = this.options;
    const deletedEntry: DataSourceEntry = storage.pop();

    const dataProvider: string = deletedEntry.descriptor.options.data.dataProvider;
    if (dataProvider !== undefined) {
      let entries: DataSourceEntry[] | undefined = entriesThatUsedDataProvider.get(dataProvider);
      entries?.splice(0, -1);
    }

    addReason(DataSourceChangeEventReason.RemoveEntry, [deletedEntry]);
  }
}
