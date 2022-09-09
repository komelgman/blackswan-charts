import { TextStyle } from '@/model/ChartStyle';
import { LogicSize, Range } from '@/model/type-defs';

export default interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
}
