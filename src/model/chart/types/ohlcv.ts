import type { HasType } from '@/model/type-defs/optional';
import type { UTCTimestamp, Price, Range, TimePeriod } from '@/model/chart/types';
import type { ExternalContent } from '@/model/databinding';

export const OHLCV_RECORD_OPEN = 0;
export const OHLCV_RECORD_HIGH = 1;
export const OHLCV_RECORD_LOW = 2;
export const OHLCV_RECORD_CLOSE = 3;
export const OHLCV_RECORD_VOLUME = 4;

export declare type OHLCvRecord = [o: Price, h: Price, l: Price, c: Price, v?: number];

export declare type OHLCv = {
  loaded: Range<UTCTimestamp>;
  available: Range<UTCTimestamp>;
  step: TimePeriod;
  values: OHLCvRecord[];
};

export declare type OHLCvPlotOptions = HasType<string>;

export declare type OHLCvPlot<O extends OHLCvPlotOptions> = ExternalContent<OHLCvContentOptions, OHLCv> & {
  plotOptions: O;
};

export declare type OHLCvContentOptions = HasType<'OHLCvContentOptions'> & {
  symbol: string;
  step: TimePeriod;
  provider?: string;
  visibleTimeRange?: Range<UTCTimestamp>;
  extendedRange?: {
    barsBefore: number;
    barsAfther?: number;
  }
};

export const OHLCV_BAR_TIMESTAMP = 0;
export const OHLCV_BAR_OPEN = 1;
export const OHLCV_BAR_HIGH = 2;
export const OHLCV_BAR_LOW = 3;
export const OHLCV_BAR_CLOSE = 4;
export const OHLCV_BAR_VOLUME = 5;

export declare type OHLCvBar = [time: UTCTimestamp, o: Price, h: Price, l: Price, c: Price, v?: number];
