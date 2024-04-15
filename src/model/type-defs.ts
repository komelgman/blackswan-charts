import type PriceAxisScale from '@/model/axis/scaling/PriceAxisScale';
import type { DrawingReference } from '@/model/datasource/Drawing';

export const enum RegularTimePeriod {
  m1 = 1 * 60 * 1000,
  m5 = 5 * 60 * 1000,
  m15 = 15 * 60 * 1000,
  m30 = 30 * 60 * 1000,
  h1 = 60 * 60 * 1000,
  h4 = 4 * 60 * 60 * 1000,
  day = 24 * 60 * 60 * 1000,
  week = 7 * 24 * 60 * 60 * 1000,
}

export declare type Nominal<T, Name extends string> = T & { [Symbol.species]: Name; };
export declare type Wrapped<T> = { value: T };
export declare type Predicate<T> = (factor: T) => boolean;
export declare type Processor<T> = (value: T) => void;

export declare type NameTimedPeriod = 'Month' | 'Year';
export declare type TimePeriod = RegularTimePeriod | NameTimedPeriod;
export declare type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;
export declare type Price = Nominal<number, 'Price'>;

export declare type Range<T> = { from: T, to: T };
export declare type Point = { x: number, y: number };
export declare type LogicSize = { main: number, second: number };

export declare type LineWidth = 1 | 2 | 3 | 4;

export const enum LineBound {
  NoBound,
  BoundStart,
  BoundEnd,
  Both,
}

export const enum LineFillStyle {
  Solid = 0,
  Dotted = 1,
  Dashed = 2,
  LargeDashed = 3,
  SparseDotted = 4,
}

export interface LineStyle {
  lineWidth: LineWidth;
  fill: LineFillStyle;
  color: string;
}

export interface RectStyle {
  color: string;
  border?: LineStyle;
}

interface AbstractLine<D> {
  def: D;
  style: LineStyle;
}

export declare type HLine = AbstractLine<Price>;
export declare type VLine = AbstractLine<UTCTimestamp>;
export declare type LineDef = [UTCTimestamp, Price, UTCTimestamp, Price];

export declare type Line = AbstractLine<LineDef> & {
  boundType: LineBound;
  scale: PriceAxisScale;
};

export declare type SubtypedData = {
  subtype: string;
}

export declare type DependsOnDataProvider = {
  dataProvider: string;
}

export declare type OHLCv = {
  from: UTCTimestamp;
  step: UTCTimestamp;
  values: [o: Price, h: Price, l: Price, c: Price, v?: number][];
}

export declare type OHLCvChart = OHLCv & {
  style: any;
}

export declare type VolumeIndicator = SubtypedData & DependsOnDataProvider & {
  style: any;
}

export interface CandleColors {
  wick: string;
  body: string;
  border: string;
}

export declare type CandleType = 'bearish' | 'bullish';

export interface CandlestickChartStyle extends Record<CandleType, CandleColors> {
  showWick: boolean;
  showBody: boolean;
  showBorder: boolean;
}
