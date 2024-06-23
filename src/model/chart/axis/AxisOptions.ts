import type { TextStyle } from '@/model/chart/types/styles';
import type { LogicSize, Range } from '@/model/chart/types';

export const enum ZoomType {
  IN = -0.01, OUT = 0.01,
}

export default interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
}
