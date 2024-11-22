import { RegularTimePeriod } from '@/model/chart/types/time';
import { type UTCTimestamp } from '@/model/chart/types';

export class DayTimePeriod extends RegularTimePeriod {
  public label(time: UTCTimestamp): string {
    const month = this.up?.up; // skeep week
    if (month?.is(time)) {
      return month.label(time);
    }

    return this.labelFormatter(time);
  }
}
