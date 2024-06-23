import type { Point } from '@/model/chart/types';

export default interface ResizeHandleMoveEvent {
  preventDrag: () => void;
  allowDrag: () => void;
  index: number;
  dx: number;
  dy: number;
  from: Point,
  changeX: number,
  changeY: number,
}
