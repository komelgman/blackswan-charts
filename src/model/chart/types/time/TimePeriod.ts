import type { Millisecons, TimePeriods, UTCTimestamp } from '@/model/chart/types/time-types';

export interface TimePeriod {
  get up(): TimePeriod | undefined;
  get name(): TimePeriods;
  get averageBarDuration(): Millisecons;
  barToTime(from: UTCTimestamp, bar: number): UTCTimestamp;
  timeToBar(from: UTCTimestamp, time: UTCTimestamp): number;
  timeToBar(from: UTCTimestamp, time: UTCTimestamp): number;
  getBarDuration(time: UTCTimestamp): Millisecons;
  floor(time: UTCTimestamp): UTCTimestamp;
  is(time: UTCTimestamp): boolean;
  label(time: UTCTimestamp): string;
}
