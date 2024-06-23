import { clone } from '@/misc/object.clone';
import type PriceAxis from '@/model/chart/axis/PriceAxis';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';

export interface UpdatePriceAxisScaleOptions extends HistoricalIncidentOptions {
  axis: PriceAxis;
  scale: PriceAxisScale;
}

export default class UpdatePriceAxisScale extends AbstractHistoricalIncident<UpdatePriceAxisScaleOptions> {
  private readonly initial: PriceAxisScale;

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
