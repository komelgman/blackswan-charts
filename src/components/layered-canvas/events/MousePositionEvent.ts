import type { Point } from '@/model/chart/types';

export interface MousePositionEvent extends Point {
  elementHeight: number;
  elementWidth: number;
}
