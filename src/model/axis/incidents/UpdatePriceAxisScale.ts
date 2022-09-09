import { clone } from '@/misc/strict-type-checks';
import PriceAxis from '@/model/axis/PriceAxis';
import PriceScale from '@/model/axis/scaling/PriceScale';
import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';

export interface UpdatePriceAxisScaleOptions extends HistoricalIncidentOptions {
  axis: PriceAxis;
  scale: PriceScale;
}

export default class UpdatePriceAxisScale extends AbstractHistoricalIncident<UpdatePriceAxisScaleOptions> {
  private readonly initial: PriceScale;

  public constructor(options: UpdatePriceAxisScaleOptions) {
    super(options);
    this.initial = clone(options.axis.scale);
  }

  protected applyIncident(): void {
    const { axis, scale } = this.options;
    axis.update({ scale });
  }

  protected inverseIncident(): void {
    const { axis } = this.options;
    axis.update({ scale: this.initial });
  }
}
