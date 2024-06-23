import type { Point } from '@/model/chart/types';

export interface ZoomEvent {
  pivot: Point;
  delta: number;
}
