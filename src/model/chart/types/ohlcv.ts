import type { HasStyle, HasType } from '@/model/type-defs/optional';
import type { UTCTimestamp, Price, Range, TimePeriod } from '@/model/chart/types';

export declare type OHLCvChart<Style> = HasStyle<Style> & {
  pipeOptions?: OHLCvPipeOptions,
  content?: OHLCv,
};

export declare type OHLCvPipeOptions = HasType<'OHLCvPipeOptions'> & {
  symbol: string;
  step: TimePeriod;
};

export declare type OHLCv = {
  loaded: Range<UTCTimestamp>;
  available: Range<UTCTimestamp>;
  step: TimePeriod;
  values: [o: Price, h: Price, l: Price, c: Price, v?: number][];
};
