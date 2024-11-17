import type TimeAxis from '@/model/chart/axis/TimeAxis';
import { type HistoricalIncidentOptions, AbstractHistoricalIncident } from '@/model/history';

export interface UpdateTimeAxisJustfollowOptions extends HistoricalIncidentOptions {
  axis: TimeAxis;
  justfollow: boolean;
}

export class UpdateTimeAxisJustfollow extends AbstractHistoricalIncident<UpdateTimeAxisJustfollowOptions> {
  public constructor(options: UpdateTimeAxisJustfollowOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { axis, justfollow } = this.options;
    axis.noHistoryManagedUpdate({ justfollow });
  }

  protected inverseIncident(): void {
    const { axis, justfollow } = this.options;
    axis.noHistoryManagedUpdate({ justfollow: !justfollow });
  }
}
