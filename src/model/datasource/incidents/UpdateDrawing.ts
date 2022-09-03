import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import { DeepPartial, isEmpty, merge } from '@/misc/strict-type-checks';
import { DrawingOptions } from '@/model/datasource/Drawing';
import { CanMergeWith } from '@/misc/CanMergeWith';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { IsNexusIncident } from '@/model/history/TVAProtocol';

export interface UpdateOptions extends HistoricalIncidentOptions {
  drawingOptions: DrawingOptions<unknown>;
  update: DeepPartial<DrawingOptions<unknown>>;
  addReason: (reason: DataSourceChangeEventReason) => void;
}

export default class UpdateDrawing extends AbstractHistoricalIncident<UpdateOptions> implements CanMergeWith<UpdateDrawing>, IsNexusIncident {
  protected marker: string = '--update-drawing-in-datasource';
  private unmerge!: Record<string, unknown>;

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: UpdateOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { drawingOptions, update, addReason } = this.options;
    merge(drawingOptions, { valid: false });
    // eslint-disable-next-line prefer-destructuring
    this.unmerge = merge(drawingOptions, update)[1];
    addReason(DataSourceChangeEventReason.UpdateEntry);
  }

  protected inverseIncident(): void {
    const { drawingOptions, addReason } = this.options;
    merge(drawingOptions, this.unmerge, { valid: false });
    addReason(DataSourceChangeEventReason.UpdateEntry);
  }

  public mergeWith(op: UpdateDrawing): boolean {
    if (op.marker === undefined || op.marker !== this.marker) {
      return false; // isn't update incident
    }

    if (op.options.drawingOptions.id !== this.options.drawingOptions.id) {
      return false; // update for another one drawing
    }

    const { drawingOptions, update } = this.options;
    merge(update, op.options.update); // combine updates
    merge(drawingOptions, this.unmerge); // restore original state

    return true;
  }

  public isNexusIncident(): boolean {
    return isEmpty(this.unmerge);
  }
}
