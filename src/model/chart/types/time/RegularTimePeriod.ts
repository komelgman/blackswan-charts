import { NonReactive } from '@/model/type-defs/decorators';
import type { UTCTimestamp, TimePeriod, Millisecons } from '@/model/chart/types';

@NonReactive
export class RegularTimePeriod implements TimePeriod {
  private readonly duration: Millisecons;

  public constructor(duration: Millisecons) {
    this.duration = duration;
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
}
