import { TimePeriod, UTCTimestamp } from '@/model/type-defs';

export interface TimeSeriesOptions {
  start: UTCTimestamp;
  period: TimePeriod;
  data: number[][];
}

export default abstract class TimeSeries {
  readonly options: TimeSeriesOptions;

  protected constructor(options: TimeSeriesOptions) {
    this.options = options;
  }
}
