import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';

export interface RemoveOptions extends HistoricalIncidentOptions {
  index: number;
  dataSourceEntries: DataSourceEntry[];
  addReason: (reason: DataSourceChangeEventReason) => void;
}

export default class RemoveDrawing extends AbstractHistoricalIncident<RemoveOptions> {
  private entry!: DataSourceEntry;
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: RemoveOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { index, dataSourceEntries, addReason } = this.options;
    this.entry = dataSourceEntries.splice(index, 1)[0] as DataSourceEntry;
    addReason(DataSourceChangeEventReason.RemoveEntry);
  }

  protected inverseIncident(): void {
    const { index, dataSourceEntries, addReason } = this.options;
    dataSourceEntries.splice(index, 0, this.entry);
    addReason(DataSourceChangeEventReason.AddEntry);
  }
}
