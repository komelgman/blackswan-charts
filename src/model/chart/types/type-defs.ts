import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import type { Nominal } from '@/model/type-defs';
import type { UTCTimestamp } from '@/model/chart/types';

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
export declare type Line = AbstractLine<[UTCTimestamp, Price, UTCTimestamp, Price]> & {
  boundType: LineBound;
  scale: PriceAxisScale;
};

export interface BarColors {
  body: string;
  border: string;
}

export interface CandleColors extends BarColors {
  wick: string;
}

export declare type CandleType = 'bearish' | 'bullish';
