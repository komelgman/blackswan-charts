import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface UpdatePriceAxisScaleOptions extends HistoricalIncidentOptions {
  axis: PriceAxis;
  scale: keyof typeof PriceScales;
}

export class UpdatePriceAxisScale extends AbstractHistoricalIncident<UpdatePriceAxisScaleOptions> {
  private readonly initial: keyof typeof PriceScales;

  public constructor(options: UpdatePriceAxisScaleOptions) {
    super(options);
    this.initial = options.axis.scale.id;
  }

  protected applyIncident(): void {
    const { axis, scale } = this.options;
    axis.noHistoryManagedUpdate({ scale });
  }

  protected inverseIncident(): void {
    const { axis } = this.options;
    axis.noHistoryManagedUpdate({ scale: this.initial });
  }
}
