import type { Nominal } from '@/model/type-defs';
import type { TimePeriod } from './time/TimePeriod';
import { RegularTimePeriod } from './time/RegularTimePeriod';
import { MonthTimePeriod } from './time/MonthTimePeriod';
import { YearTimePeriod } from './time/YearTimePeriod';

export declare type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;
export declare type Millisecons = Nominal<number, 'Millisecons'>;

export const MILLISECONDS_PER_MINUTE = 60 * 1000 as Millisecons;
export const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE as Millisecons;
export const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR as Millisecons;

export const enum TimePeriodName {
  m1 = 'm1',
  m5 = 'm5',
  m15 = 'm15',
  m30 = 'm30',
  h1 = 'h1',
  h4 = 'h4',
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}

export const TIME_PERIODS: Map<TimePeriodName, TimePeriod> = new Map([
  [TimePeriodName.m1, new RegularTimePeriod(1 * MILLISECONDS_PER_MINUTE as Millisecons)],
  [TimePeriodName.m5, new RegularTimePeriod(5 * MILLISECONDS_PER_MINUTE as Millisecons)],
  [TimePeriodName.m15, new RegularTimePeriod(15 * MILLISECONDS_PER_MINUTE as Millisecons)],
  [TimePeriodName.m30, new RegularTimePeriod(30 * MILLISECONDS_PER_MINUTE as Millisecons)],
  [TimePeriodName.h1, new RegularTimePeriod(1 * MILLISECONDS_PER_HOUR as Millisecons)],
  [TimePeriodName.h4, new RegularTimePeriod(4 * MILLISECONDS_PER_HOUR as Millisecons)],
  [TimePeriodName.day, new RegularTimePeriod(1 * MILLISECONDS_PER_DAY as Millisecons)],
  [TimePeriodName.week, new RegularTimePeriod(7 * MILLISECONDS_PER_DAY as Millisecons)],
  [TimePeriodName.month, new MonthTimePeriod()],
  [TimePeriodName.year, new YearTimePeriod()],
]);
