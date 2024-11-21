import { type UTCTimestamp, type TimePeriod, MS_PER_DAY, type Millisecons, MS_PER_MONTH, TimePeriods } from '@/model/chart/types';

const MONTHS_ABBR: string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// todo: test it
export class MonthTimePeriod implements TimePeriod {
  public readonly up: TimePeriod | undefined = undefined;
  public readonly name: TimePeriods = TimePeriods.month;
  public readonly averageBarDuration: Millisecons = MS_PER_MONTH as Millisecons;

  public constructor(up: TimePeriod) {
    this.up = up;
  }

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

    return (daysInMonth * MS_PER_DAY) as Millisecons;
  }

  public floor(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);

    return date.getTime() as UTCTimestamp;
  }

  public round(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);
    const currentMonth = date.getUTCMonth();
    const currentDate = date.getUTCDate();

    if (currentDate >= 15) {
      date.setUTCMonth(currentMonth + 1);
    }

    date.setUTCDate(1);
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

    return MONTHS_ABBR[new Date(time).getUTCMonth()];
  }
}
