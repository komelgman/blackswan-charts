import { NonReactive } from '@/model/type-defs/decorators';
import { type UTCTimestamp, type TimePeriod, MILLISECONDS_PER_DAY, type Millisecons } from '@/model/chart/types';

// todo: test it
@NonReactive
export class MonthTimePeriod implements TimePeriod {
  public readonly averageBarDuration: Millisecons = 30.44 * MILLISECONDS_PER_DAY as Millisecons;

  public barToTime(from: UTCTimestamp, bar: number): UTCTimestamp {
    const date = new Date(from);
    date.setUTCMonth(date.getUTCMonth() + bar);
    return date.getTime() as UTCTimestamp;
  }

  public timeToBar(from: UTCTimestamp, time: UTCTimestamp): number {
    const fromDate = new Date(from);
    const toDate = new Date(time);
    return (
      (toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12
      + toDate.getUTCMonth() - fromDate.getUTCMonth()
      + (toDate.getUTCDate() < fromDate.getUTCDate() ? -1 : 0)
    );
  }

  public getBarDuration(time: UTCTimestamp): Millisecons {
    const date = new Date(time);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    const daysInMonth = lastDayOfMonth.getUTCDate();

    return (daysInMonth * MILLISECONDS_PER_DAY) as Millisecons;
  }
}
