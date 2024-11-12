import type { TextStyle } from '@/model/chart/types/styles';
import type { LogicSize, Range } from '@/model/chart/types';
import type { ControlMode } from '@/model/chart/axis/types';
import type { PrimaryEntryRef } from '@/model/datasource/PrimaryEntry';

export interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
  controlMode?: ControlMode
  primaryEntryRef?: PrimaryEntryRef;
}
