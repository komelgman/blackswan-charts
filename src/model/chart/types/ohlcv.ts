import type { HasType } from '@/model/type-defs/optional';
import type { UTCTimestamp, Price, Range, TimePeriod } from '@/model/chart/types';

export declare type OHLCv = {
  loaded: Range<UTCTimestamp>;
  available: Range<UTCTimestamp>;
  step: TimePeriod;
  values: [o: Price, h: Price, l: Price, c: Price, v?: number][];
};

export declare type OHLCvPlotOptions = HasType<string>;

export declare type OHLCvPlot<O extends OHLCvPlotOptions> = {
  plotOptions: O;
  pipeOptions?: OHLCvPipeOptions;
  content?: OHLCv;
};

export declare type OHLCvPipeOptions = HasType<'OHLCvPipeOptions'> & {
  symbol: string;
  step: TimePeriod;
  extendedRange?: {
    barsBefore: number;
    barsAfther?: number;
  }
};

export declare type OHCLvBar = [time: UTCTimestamp, o: Price, h: Price, l: Price, c: Price, v?: number];
