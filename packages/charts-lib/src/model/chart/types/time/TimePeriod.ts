import type { Millisecons, UTCTimestamp } from '@/model/chart/types';

export interface TimePeriod {
  get up(): TimePeriod | undefined;
  get name(): TimePeriods;
  get averageBarDuration(): Millisecons;
  barToTime(from: UTCTimestamp, bar: number): UTCTimestamp;
  timeToBar(from: UTCTimestamp, time: UTCTimestamp): number;
  timeToBar(from: UTCTimestamp, time: UTCTimestamp): number;
  getBarDuration(time: UTCTimestamp): Millisecons;
  floor(time: UTCTimestamp): UTCTimestamp;
  ceil(time: UTCTimestamp): UTCTimestamp ;
  is(time: UTCTimestamp): boolean;
  label(time: UTCTimestamp): string;
}

export const MS_PER_SECOND = 1000 as Millisecons;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND as Millisecons;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE as Millisecons;
export const MS_PER_DAY = 24 * MS_PER_HOUR as Millisecons;
export const MS_PER_MONTH = 30.44 * MS_PER_DAY as Millisecons;
export const MS_PER_YEAR = 365.25 * MS_PER_DAY as Millisecons;

export enum TimePeriods {
  minimal = 's1',
  maximal = 'centry',
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
  centry = 'centry',
}
