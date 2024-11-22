import { type TimePeriod, TimePeriods } from '@/model/chart/types/time';
import { type UTCTimestamp, type Millisecons } from '@/model/chart/types';

export declare type LabelFormatter = (t: UTCTimestamp) => string;

export class RegularTimePeriod implements TimePeriod {
  public readonly up: TimePeriod | undefined = undefined;
  public readonly name: TimePeriods;
  protected readonly duration: Millisecons;
  protected readonly labelFormatter: LabelFormatter;

  public constructor(name: TimePeriods, duration: Millisecons, up: TimePeriod, labelFormatter: LabelFormatter) {
    this.up = up;
    this.name = name;
    this.duration = duration;
    this.labelFormatter = labelFormatter;
  }

  public get averageBarDuration(): Millisecons {
    return this.duration;
  }

  public barToTime(from: UTCTimestamp, bar: number): UTCTimestamp {
    return from + bar * this.duration as UTCTimestamp;
  }

  public timeToBar(from: UTCTimestamp, time: UTCTimestamp): number {
    return (time - from) / this.duration;
  }

  public getBarDuration(): Millisecons {
    return this.duration;
  }

  public floor(time: UTCTimestamp): UTCTimestamp {
    const remainder = time % this.duration;
    return (time - remainder) as UTCTimestamp;
  }

  public ceil(time: UTCTimestamp): UTCTimestamp {
    const remainder = time % this.duration;
    if (remainder === 0) {
      return time;
    }
    return (time + (this.duration - remainder)) as UTCTimestamp;
  }

  public is(time: UTCTimestamp): boolean {
    return time % this.duration === 0;
  }

  public label(time: UTCTimestamp): string {
    if (this.up?.is(time)) {
      return this.up.label(time);
    }

    return this.labelFormatter(time);
  }
}
