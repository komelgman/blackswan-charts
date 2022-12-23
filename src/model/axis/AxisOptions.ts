import type { TextStyle } from '@/model/ChartStyle';
import type { LogicSize, Range } from '@/model/type-defs';

export default interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
}
