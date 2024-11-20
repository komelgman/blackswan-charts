import type { Millisecons, UTCTimestamp } from '@/model/chart/types/time';

export interface TimePeriod {
  get averageBarDuration(): Millisecons;
  barToTime(from: UTCTimestamp, bar: number): UTCTimestamp;
  timeToBar(from: UTCTimestamp, time: UTCTimestamp): number;
  timeToBar(from: UTCTimestamp, time: UTCTimestamp): number;
  getBarDuration(time: UTCTimestamp): Millisecons;
}
