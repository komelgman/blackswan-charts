import type ResizeHandle from '@/components/layout/ResizeHandle.vue';
import type { Point } from '@/model/type-defs';

export default interface ResizeHandleMoveEvent {
  sender: ResizeHandle;
  index: number;
  dx: number;
  dy: number;
  from: Point,
  changeX: number,
  changeY: number,
}
