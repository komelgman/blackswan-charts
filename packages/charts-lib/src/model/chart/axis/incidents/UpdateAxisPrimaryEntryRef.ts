import { toRaw } from 'vue';
import type { PrimaryEntryRef } from '@/model/datasource/PrimaryEntry';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';
import type { AxisOptions } from '@/model/chart/axis/types';
import type Axis from '@/model/chart/axis/Axis';

export interface UpdateAxisPrimaryEntryRefOptions<T extends number> extends HistoricalIncidentOptions {
  axis: Axis<T, AxisOptions<T>>;
  entryRef: PrimaryEntryRef | undefined;
}

export class UpdateAxisPrimaryEntryRef<T extends number> extends AbstractHistoricalIncident<UpdateAxisPrimaryEntryRefOptions<T>> {
  private readonly initial: PrimaryEntryRef | undefined;

  public constructor(options: UpdateAxisPrimaryEntryRefOptions<T>) {
    super(options);
    const tmp = toRaw(options.axis.primaryEntryRef).value;
    this.initial = tmp ? { ...tmp } : undefined;
  }

  protected applyIncident(): void {
    const { axis, entryRef } = this.options;
    axis.noHistoryManagedUpdate({ primaryEntryRef: entryRef });
  }

  protected inverseIncident(): void {
    const { axis } = this.options;
    axis.noHistoryManagedUpdate({ primaryEntryRef: this.initial });
  }
}
