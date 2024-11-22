import { type TimePeriod, MS_PER_DAY, MS_PER_YEAR, TimePeriods } from '@/model/chart/types/time';
import { type UTCTimestamp, type Millisecons } from '@/model/chart/types';

const ROMAN_NUMERALS: string[] = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV',
];

// todo: test it
export class CentryTimePeriod implements TimePeriod {
  public readonly up: TimePeriod | undefined = undefined;
  public readonly name: TimePeriods = TimePeriods.centry;
  public readonly averageBarDuration: Millisecons = (MS_PER_YEAR * 100) as Millisecons;

  public barToTime(from: UTCTimestamp, bar: number): UTCTimestamp {
    // todo: test it!!!!
    const date = new Date(from);
    date.setUTCFullYear(date.getUTCFullYear() + (bar * 100));
    return date.getTime() as UTCTimestamp;
  }

  public timeToBar(from: UTCTimestamp, time: UTCTimestamp): number {
    // todo: test it!!!!
    const fromDate = new Date(from);
    const toDate = new Date(time);
    const fromCentury = Math.floor(fromDate.getUTCFullYear() / 100);
    const toCentury = Math.floor(toDate.getUTCFullYear() / 100);

    const needCorrect = toDate.getUTCFullYear() % 100 === 0
      && (toDate.getUTCMonth() < fromDate.getUTCMonth()
        || (toDate.getUTCMonth() === fromDate.getUTCMonth() && toDate.getUTCDate() < fromDate.getUTCDate())
      );

    return toCentury - fromCentury + (needCorrect ? -1 : 0);
  }

  public getBarDuration(time: UTCTimestamp): Millisecons {
    const date = new Date(time);
    const startYear = Math.floor(date.getUTCFullYear() / 100) * 100;
    let totalDays = 0;

    for (let year = startYear; year < startYear + 100; year++) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      totalDays += isLeapYear ? 366 : 365;
    }

    return (totalDays * MS_PER_DAY) as Millisecons;
  }

  public floor(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);
    const century = Math.floor(date.getUTCFullYear() / 100) * 100;
    date.setUTCFullYear(century);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);

    return date.getTime() as UTCTimestamp;
  }

  public ceil(time: UTCTimestamp): UTCTimestamp {
    const date = new Date(time);
    const currentCentury = Math.floor(date.getUTCFullYear() / 100) * 100;

    if (
      date.getUTCFullYear() === currentCentury
      && date.getUTCMonth() === 0
      && date.getUTCDate() === 1
      && date.getUTCHours() === 0
      && date.getUTCMinutes() === 0
      && date.getUTCSeconds() === 0
      && date.getUTCMilliseconds() === 0
    ) {
      return time;
    }

    date.setUTCFullYear(currentCentury + 100);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);

    return date.getTime() as UTCTimestamp;
  }

  public is(time: UTCTimestamp): boolean {
    return this.floor(time) === time;
  }

  public label(time: UTCTimestamp): string {
    const year = new Date(time).getUTCFullYear();
    const century = Math.floor(year / 100) + 1;

    return ROMAN_NUMERALS[century];
  }
}
