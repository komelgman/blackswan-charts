import { type UTCTimestamp, type TimePeriod, type Millisecons, TimePeriods } from '@/model/chart/types';

export declare type LabelFormatter = (t: UTCTimestamp) => string;

export const HHMM_LABEL_FORMATTER: LabelFormatter = (t: UTCTimestamp) => {
  const date = new Date(t);
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
};

export const SS_LABEL_FORMATTER: LabelFormatter = (t: UTCTimestamp) => {
  const date = new Date(t);
  return `${String(date.getUTCSeconds()).padStart(2, '0')}s`;
};

export const DAY_LABEL_FORMATTER: LabelFormatter = (t: UTCTimestamp) => {
  const date = new Date(t);
  return `${date.getUTCDate()}`;
};

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
