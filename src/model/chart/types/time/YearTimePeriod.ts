import { type UTCTimestamp, type TimePeriod, MS_PER_DAY, type Millisecons, MS_PER_YEAR, TimePeriods } from '@/model/chart/types';

// todo: test it
export class YearTimePeriod implements TimePeriod {
  public readonly up: TimePeriod | undefined = undefined;
  public readonly name: TimePeriods = TimePeriods.year;
  public readonly averageBarDuration: Millisecons = MS_PER_YEAR as Millisecons;

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

    return (daysInYear * MS_PER_DAY) as Millisecons;
  }

  public floor(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);

    return date.getTime() as UTCTimestamp;
  }

  public is(time: UTCTimestamp): boolean {
    return this.floor(time) === time;
  }

  public label(time: UTCTimestamp): string {
    return `${new Date(time).getUTCFullYear()}`;
  }
}
