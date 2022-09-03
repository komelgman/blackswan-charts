import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import { ChartStyle } from '@/model/ChartStyle';
import { DeepPartial, merge } from '@/misc/strict-type-checks';

export interface UpdateChartStyleOptions extends HistoricalIncidentOptions {
  style: ChartStyle;
  update: DeepPartial<ChartStyle>;
}

// todo: see datasource/incidents/update nexus|mergeable
export default class UpdateChartStyle extends AbstractHistoricalIncident<UpdateChartStyleOptions> {
  private unmerge!: Record<string, unknown>;
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: UpdateChartStyleOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { style, update } = this.options;
    // eslint-disable-next-line prefer-destructuring
    this.unmerge = merge(style, update)[1];
  }

  protected inverseIncident(): void {
    const { style } = this.options;
    merge(style, this.unmerge);
  }
}
