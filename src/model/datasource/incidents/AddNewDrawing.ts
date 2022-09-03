import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import { DrawingOptions } from '@/model/datasource/Drawing';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';

export interface AddNewOptions extends HistoricalIncidentOptions {
  drawingOptions: DrawingOptions<unknown>;
  dataSourceEntries: DataSourceEntry[];
  addReason: (reason: DataSourceChangeEventReason) => void;
}

export default class AddNewDrawing extends AbstractHistoricalIncident<AddNewOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: AddNewOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { drawingOptions, dataSourceEntries, addReason } = this.options;
    drawingOptions.valid = false;
    dataSourceEntries.push([drawingOptions]);
    addReason(DataSourceChangeEventReason.AddEntry);
  }

  protected inverseIncident(): void {
    const { dataSourceEntries, addReason } = this.options;
    dataSourceEntries.pop();
    addReason(DataSourceChangeEventReason.RemoveEntry);
  }
}
