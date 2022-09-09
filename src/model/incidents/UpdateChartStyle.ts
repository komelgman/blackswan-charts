import { DeepPartial, isEmpty, merge } from '@/misc/strict-type-checks';
import { ChartStyle } from '@/model/ChartStyle';
import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import { IsNexusIncident } from '@/model/history/TVAProtocol';
import { CanMergeWith } from '@/model/options/CanMergeWith';

export interface UpdateChartStyleOptions extends HistoricalIncidentOptions {
  style: ChartStyle;
  update: DeepPartial<ChartStyle>;
}

export default class UpdateChartStyle
  extends AbstractHistoricalIncident<UpdateChartStyleOptions>
  implements CanMergeWith<UpdateChartStyle>, IsNexusIncident {
  // ---------------------------------------------------------
  protected marker: string = '--update-chart-style';
  private unmerge!: Record<string, unknown>;

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: UpdateChartStyleOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { style, update } = this.options;
    [, this.unmerge] = merge(style, update);
  }

  protected inverseIncident(): void {
    const { style } = this.options;
    merge(style, this.unmerge);
  }

  public mergeWith(op: UpdateChartStyle): boolean {
    if (op.marker === undefined || op.marker !== this.marker) {
      return false; // isn't update chart style incident
    }

    const { style, update } = this.options;
    merge(update, op.options.update); // combine updates
    merge(style, this.unmerge); // restore original state

    return true;
  }

  public isNexusIncident(): boolean {
    return isEmpty(this.unmerge);
  }
}
