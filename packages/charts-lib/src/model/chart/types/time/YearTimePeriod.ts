import { type TimePeriod, MS_PER_DAY, MS_PER_YEAR, TimePeriods } from '@/model/chart/types/time';
import { type UTCTimestamp, type Millisecons } from '@/model/chart/types';
// todo: test it
export class YearTimePeriod implements TimePeriod {
  public readonly up: TimePeriod | undefined;
  public readonly name: TimePeriods = TimePeriods.year;
  public readonly averageBarDuration: Millisecons = MS_PER_YEAR as Millisecons;

  public constructor(up: TimePeriod) {
    this.up = up;
  }

  public barToTime(from: UTCTimestamp, bar: number): UTCTimestamp {
    const date = new Date(from);
    date.setUTCFullYear(date.getUTCFullYear() + bar);
    return date.getTime() as UTCTimestamp;
  }

  public timeToBar(from: UTCTimestamp, time: UTCTimestamp): number {
    const fromDate = new Date(from);
    const toDate = new Date(time);
    const needCorrect = toDate.getUTCMonth() < fromDate.getUTCMonth()
      || (toDate.getUTCMonth() === fromDate.getUTCMonth() && toDate.getUTCDate() < fromDate.getUTCDate());
    const correction = needCorrect ? -1 : 0;

    return toDate.getUTCFullYear() - fromDate.getUTCFullYear() + correction;
  }

  public getBarDuration(time: UTCTimestamp): Millisecons {
    const date = new Date(time);
    const year = date.getUTCFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInYear = isLeapYear ? 366 : 365;

    return (daysInYear * MS_PER_DAY) as Millisecons;
  }

  public floor(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);

    return date.getTime() as UTCTimestamp;
  }

  public ceil(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);

    if (
      date.getUTCMonth() === 0
      && date.getUTCDate() === 1
      && date.getUTCHours() === 0
      && date.getUTCMinutes() === 0
      && date.getUTCSeconds() === 0
      && date.getUTCMilliseconds() === 0
    ) {
      return time;
    }

    date.setUTCFullYear(date.getUTCFullYear() + 1);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);

    return date.getTime() as UTCTimestamp;
  }

  public is(time: UTCTimestamp): boolean {
    return this.floor(time) === time;
  }

  public label(time: UTCTimestamp): string {
    if (this.up?.is(time)) {
      return this.up.label(time);
    }

    return `${new Date(time).getUTCFullYear()}`;
  }
}
