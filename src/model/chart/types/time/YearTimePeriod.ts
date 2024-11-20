import { NonReactive } from '@/model/type-defs/decorators';
import { type UTCTimestamp, type TimePeriod, MILLISECONDS_PER_DAY, type Millisecons } from '@/model/chart/types';

// todo: test it
@NonReactive
export class YearTimePeriod implements TimePeriod {
  public readonly averageBarDuration: Millisecons = 365.25 * MILLISECONDS_PER_DAY as Millisecons;

  public barToTime(from: UTCTimestamp, bar: number): UTCTimestamp {
    const date = new Date(from);
    date.setUTCFullYear(date.getUTCFullYear() + bar);
    return date.getTime() as UTCTimestamp;
  }

  public timeToBar(from: UTCTimestamp, time: UTCTimestamp): number {
    const fromDate = new Date(from);
    const toDate = new Date(time);
    const correction = toDate.getUTCMonth() < fromDate.getUTCMonth()
    || (toDate.getUTCMonth() === fromDate.getUTCMonth() && toDate.getUTCDate() < fromDate.getUTCDate())
      ? -1
      : 0;
    return (toDate.getUTCFullYear() - fromDate.getUTCFullYear() + correction);
  }

  public getBarDuration(time: UTCTimestamp): Millisecons {
    const date = new Date(time);
    const year = date.getUTCFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInYear = isLeapYear ? 366 : 365;

    return (daysInYear * MILLISECONDS_PER_DAY) as Millisecons;
  }
}
