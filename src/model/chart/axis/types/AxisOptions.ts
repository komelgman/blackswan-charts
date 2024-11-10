import type { TextStyle } from '@/model/chart/types/styles';
import type { LogicSize, Range } from '@/model/chart/types';
import type { PrimaryEntry } from '@/model/datasource/PrimaryEntry';
import type { ControlMode } from '@/model/chart/axis/types';

export interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
  primaryEntry?: PrimaryEntry;
  controlMode?: ControlMode
}
