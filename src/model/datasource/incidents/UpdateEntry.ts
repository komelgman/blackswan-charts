import { isEmpty, merge } from '@/misc/strict-type-checks';
import type { DeepPartial } from '@/misc/strict-type-checks';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingOptions, DrawingReference } from '@/model/datasource/Drawing';
import { isEqualDrawingReference } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import type { IsNexusIncident } from '@/model/history/TVAProtocol';
import type { CanMergeWith } from '@/model/options/CanMergeWith';

export interface UpdateOptions extends HistoricalIncidentOptions {
  ref: DrawingReference,
  storage: DataSourceEntriesStorage;
  update: DeepPartial<Omit<DrawingOptions<unknown>, 'id'>>;
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
    const { storage, ref, update, addReason } = this.options;
    const entry = storage.get(ref);
    [, this.unmerge] = merge(entry[0].options, update);
    entry[0].valid = false;

    addReason(DataSourceChangeEventReason.UpdateEntry, [entry]);
  }

  protected inverseIncident(): void {
    const { storage, ref, addReason } = this.options;
    const entry = storage.get(ref);
    merge(entry[0], { options: this.unmerge, valid: false });

    addReason(DataSourceChangeEventReason.UpdateEntry, [entry]);
  }

  public mergeWith(op: UpdateEntry): boolean {
    if (op.marker === undefined || op.marker !== this.marker) {
      return false; // isn't update incident
    }

    const opDescriptor = op.options.storage.get(op.options.ref)[0];
    const descriptor = this.options.storage.get(this.options.ref)[0];

    if (!isEqualDrawingReference(opDescriptor.ref, descriptor.ref)) {
      return false; // update for another one drawing
    }

    const { update } = this.options;
    merge(update, op.options.update); // combine updates
    merge(descriptor, { options: this.unmerge, valid: false }); // restore original state

    return true;
  }

  public isNexusIncident(): boolean {
    return isEmpty(this.unmerge);
  }
}
