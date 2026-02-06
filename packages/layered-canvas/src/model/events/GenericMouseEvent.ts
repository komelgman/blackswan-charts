import type { Point } from '@blackswan/foundation';

export interface GenericMouseEvent extends Point {
  elementHeight: number;
  elementWidth: number;
  isCtrlPressed: boolean;
  isShiftPressed: boolean;
  isAltPressed: boolean;
}
