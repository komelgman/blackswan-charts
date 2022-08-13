import { Price, Range, UTCTimestamp } from '@/model/type-defs';
import ScalingFunction from '@/model/axis/scaling/ScalingFunction';

export declare type LineWidth = 1 | 2 | 3 | 4;

export const enum LineBound {
  NoBound,
  BoundStart,
  BoundEnd,
  Both
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

export interface LineOptions {
  boundType: LineBound,
  bounds?: Range<UTCTimestamp>,
  scalingFunction?: ScalingFunction<Price>,
}
