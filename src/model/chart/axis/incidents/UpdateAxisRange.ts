import type Axis from '@/model/chart/axis/Axis';
import type AxisOptions from '@/model/chart/axis/AxisOptions';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { IsNexusIncident } from '@/model/history/TVAProtocol';
import type { Range } from '@/model/chart/types';
import type { HasMergeWith } from '@/model/type-defs/options';

export interface UpdateRangeOptions<T extends number> extends HistoricalIncidentOptions {
  axis: Axis<T, AxisOptions<T>>;
  range: Range<T>;
}

export default class UpdateAxisRange<T extends number>
  extends AbstractHistoricalIncident<UpdateRangeOptions<T>>
  implements HasMergeWith<UpdateAxisRange<T>>, IsNexusIncident {
  //---------------------------------------------------------------
  protected readonly marker: string = '--update-axis-range';
  private readonly initial: Range<T>;

  public constructor(options: UpdateRangeOptions<T>) {
    super(options);

    this.initial = { ...this.options.range };
  }

  protected applyIncident(): void {
    const { axis, range } = this.options;
    axis.update({ range });
  }

  protected inverseIncident(): void {
    const { axis } = this.options;
    axis.update({ range: this.initial });
  }

  public mergeWith(op: UpdateAxisRange<T>): boolean {
    if (op.marker !== this.marker || op.options.axis !== this.options.axis) {
      return false;
    }

    this.options.range = { ...op.options.range };
    return true;
  }

  public isNexusIncident(): boolean {
    const { from, to } = this.options.range;
    return this.initial.from === from && this.initial.to === to;
  }
}
