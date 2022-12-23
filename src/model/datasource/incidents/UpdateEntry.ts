import { isEmpty, merge } from '@/misc/strict-type-checks';
import type { DeepPartial } from '@/misc/strict-type-checks';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingDescriptor } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import type { IsNexusIncident } from '@/model/history/TVAProtocol';
import type { CanMergeWith } from '@/model/options/CanMergeWith';

export interface UpdateOptions extends HistoricalIncidentOptions {
  entry: DataSourceEntry;
  update: DeepPartial<DrawingDescriptor<unknown>>;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export default class UpdateEntry
  extends AbstractHistoricalIncident<UpdateOptions>
  implements CanMergeWith<UpdateEntry>, IsNexusIncident {
  // ------------------------------------------------------
  protected marker: string = '--update-drawing-in-datasource';
  private unmerge!: Record<string, unknown>;

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: UpdateOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { entry, update, addReason } = this.options;
    merge(entry[0], { valid: false });
    [, this.unmerge] = merge(entry[0], update);

    addReason(DataSourceChangeEventReason.UpdateEntry, [entry]);
  }

  protected inverseIncident(): void {
    const { entry, addReason } = this.options;
    merge(entry[0], this.unmerge, { valid: false });

    addReason(DataSourceChangeEventReason.UpdateEntry, [entry]);
  }

  public mergeWith(op: UpdateEntry): boolean {
    if (op.marker === undefined || op.marker !== this.marker) {
      return false; // isn't update incident
    }

    const opDescriptor = op.options.entry[0];
    const descriptor = this.options.entry[0];

    if (opDescriptor.ref !== descriptor.ref) {
      return false; // update for another one drawing
    }

    const { update } = this.options;
    merge(update, op.options.update); // combine updates
    merge(descriptor, this.unmerge); // restore original state

    return true;
  }

  public isNexusIncident(): boolean {
    return isEmpty(this.unmerge);
  }
}
