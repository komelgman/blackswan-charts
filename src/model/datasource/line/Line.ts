import { LineOptions, LineStyle } from '@/model/datasource/line/type-defs';
import { Price, UTCTimestamp } from '@/model/type-defs';

// * sample tuple
// function distanceFromOrigin([x, y]: [number, number]) {
//   return Math.sqrt(x ** 2 + y ** 2);
// }

export default interface AbstractLine<D> {
  def: D;
  style: LineStyle;
}

export declare type Line = AbstractLine<[UTCTimestamp, Price, UTCTimestamp, Price]> & LineOptions;
export declare type HorizontalLine = AbstractLine<Price>;
export declare type VerticalLine = AbstractLine<UTCTimestamp>;
