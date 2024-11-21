import type { Nominal } from '@/model/type-defs';
import {
  DAY_LABEL_FORMATTER,
  HHMM_LABEL_FORMATTER,
  SS_LABEL_FORMATTER,
  RegularTimePeriod,
  YearTimePeriod,
  MonthTimePeriod,
  DayTimePeriod,
  type TimePeriod,
} from '@/model/chart/types/';

export declare type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;
export declare type Millisecons = Nominal<number, 'Millisecons'>;

export const MS_PER_SECOND = 1000 as Millisecons;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND as Millisecons;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE as Millisecons;
export const MS_PER_DAY = 24 * MS_PER_HOUR as Millisecons;
export const MS_PER_MONTH = 30.44 * MS_PER_DAY as Millisecons;
export const MS_PER_YEAR = 365.25 * MS_PER_DAY as Millisecons;

export enum TimePeriods {
  minimal = 's1',
  maximal = 'year',
  s1 = 's1',
  s5 = 's5',
  s15 = 's15',
  s30 = 's30',
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

const { s1, s5, s15, s30, m1, m5, m15, m30, h1, h4, day, week, month, year } = TimePeriods;

let upPeriod = new YearTimePeriod();
function build(f: () => TimePeriod): TimePeriod {
  upPeriod = f();
  return upPeriod;
}

export const TIME_PERIODS: Map<TimePeriods, TimePeriod> = new Map([
  [year, upPeriod],
  [month, build(() => new MonthTimePeriod(upPeriod))],
  [week, build(() => new RegularTimePeriod(week, 7 * MS_PER_DAY as Millisecons, upPeriod, DAY_LABEL_FORMATTER))],
  [day, build(() => new DayTimePeriod(day, 1 * MS_PER_DAY as Millisecons, upPeriod, DAY_LABEL_FORMATTER))],
  [h4, build(() => new RegularTimePeriod(h4, 4 * MS_PER_HOUR as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [h1, build(() => new RegularTimePeriod(h1, 1 * MS_PER_HOUR as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m30, build(() => new RegularTimePeriod(m30, 30 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m15, build(() => new RegularTimePeriod(m15, 15 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m5, build(() => new RegularTimePeriod(m5, 5 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m1, build(() => new RegularTimePeriod(m1, 1 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [s30, build(() => new RegularTimePeriod(s30, 30 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
  [s15, build(() => new RegularTimePeriod(s15, 15 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
  [s5, build(() => new RegularTimePeriod(s5, 5 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
  [s1, build(() => new RegularTimePeriod(s1, 1 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
]);
