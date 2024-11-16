import type { Point } from '@/model/chart/types';

export interface GenericMouseEvent extends Point {
  elementHeight: number;
  elementWidth: number;
  isCtrlPressed: boolean;
  isShiftPressed: boolean;
  isAltPressed: boolean;
}
