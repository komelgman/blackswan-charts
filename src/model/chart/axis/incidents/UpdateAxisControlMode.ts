import type Axis from '@/model/chart/axis/Axis';
import { ControlMode, type AxisOptions } from '@/model/chart/axis/types';
import {
  type HistoricalIncidentOptions,
  AbstractHistoricalIncident,
} from '@/model/history';

export interface UpdateControlMode<T extends number> extends HistoricalIncidentOptions {
  axis: Axis<T, AxisOptions<T>>;
  controlMode: ControlMode;
}

export class UpdateAxisControlMode<T extends number> extends AbstractHistoricalIncident<UpdateControlMode<T>> {
  private readonly initial: ControlMode;

  public constructor(options: UpdateControlMode<T>) {
    super(options);

    this.initial = options.axis.controlMode.value;
  }

  protected applyIncident(): void {
    const { axis, controlMode } = this.options;
    axis.noHistoryManagedUpdate({ controlMode });
  }

  protected inverseIncident(): void {
    const { axis } = this.options;
    axis.noHistoryManagedUpdate({ controlMode: this.initial });
  }
}
