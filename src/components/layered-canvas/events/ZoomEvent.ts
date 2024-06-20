import type { Point } from '@/model/type-defs';

export interface ZoomEvent {
  pivot: Point;
  delta: number;
}
