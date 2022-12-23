import { clone } from '@/misc/strict-type-checks';
import type PriceAxis from '@/model/axis/PriceAxis';
import type { Inverted } from '@/model/axis/PriceAxis';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions,} from '@/model/history/HistoricalIncident';

export interface UpdatePriceAxisInvertedOptions extends HistoricalIncidentOptions {
  axis: PriceAxis;
  inverted: Inverted;
}

export default class UpdatePriceAxisInverted extends AbstractHistoricalIncident<UpdatePriceAxisInvertedOptions> {
  private readonly initial: Inverted;

  public constructor(options: UpdatePriceAxisInvertedOptions) {
    super(options);
    this.initial = clone(options.axis.inverted);
  }

  protected applyIncident(): void {
    const { axis, inverted } = this.options;
    axis.update({ inverted });
  }

  protected inverseIncident(): void {
    const { axis } = this.options;
    axis.update({ inverted: this.initial });
  }
}
