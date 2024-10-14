import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';

export interface UpdatePriceAxisInvertedOptions extends HistoricalIncidentOptions {
  axis: PriceAxis;
  inverted: boolean;
}

export default class UpdatePriceAxisInverted extends AbstractHistoricalIncident<UpdatePriceAxisInvertedOptions> {
  public constructor(options: UpdatePriceAxisInvertedOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { axis, inverted } = this.options;
    axis.update({ inverted });
  }

  protected inverseIncident(): void {
    const { axis, inverted } = this.options;
    axis.update({ inverted: !inverted });
  }
}
