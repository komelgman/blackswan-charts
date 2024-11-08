import { DataSourceChangeEventReason } from '@/model/datasource/events';
import type { DataSourceEntry, DrawingReference } from '@/model/datasource/types';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';
import type { Wrapped } from '@/model/type-defs';

export interface SetPrimaryResourceOptions extends HistoricalIncidentOptions {
  value: DrawingReference | undefined;
  target: Wrapped<DrawingReference | undefined>;
  addReason: (reason: DataSourceChangeEventReason, entries: DataSourceEntry[]) => void;
}

export class SetPrimaryResource extends AbstractHistoricalIncident<SetPrimaryResourceOptions> {
  private prevValue: DrawingReference | undefined;
  // eslint-disable-next-line no-useless-constructor

  public constructor(options: SetPrimaryResourceOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { value, target, addReason } = this.options;
    this.prevValue = target.value;
    target.value = value;

    addReason(DataSourceChangeEventReason.PrimaryResourceChanged, []);
  }

  protected inverseIncident(): void {
    const { target, addReason } = this.options;
    this.prevValue = target.value;
    target.value = this.prevValue;

    addReason(DataSourceChangeEventReason.PrimaryResourceChanged, []);
  }
}
