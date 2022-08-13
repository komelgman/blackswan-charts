import { Point } from '@/model/type-defs';
import ResizeHandle from '@/components/layout/ResizeHandle.vue';

export default interface ResizeHandleMoveEvent {
  sender: ResizeHandle;
  index: number;
  dx: number;
  dy: number;
  from: Point,
  changeX: number,
  changeY: number,
}
