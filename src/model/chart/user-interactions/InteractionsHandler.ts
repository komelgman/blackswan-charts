import type {
  DragMoveEvent,
  MouseClickEvent,
  MousePositionEvent,
  ZoomEvent,
} from '@/components/layered-canvas/events';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type Axis from '@/model/chart/axis/Axis';

export interface InteractionsHandler<InteractionSource extends Viewport | Axis<any, any>> {
  onLeftMouseBtnClick(source: InteractionSource, e: MouseClickEvent): void;
  onLeftMouseBtnDoubleClick(source: InteractionSource, e: MouseClickEvent): void;
  onMouseMove(source: InteractionSource, e: MousePositionEvent): void;
  onDragStart(source: InteractionSource, e: MouseClickEvent): void;
  onDrag(source: InteractionSource, e: DragMoveEvent): void;
  onDragEnd(source: InteractionSource, e: MousePositionEvent): void;
  onZoom(source: InteractionSource, e: ZoomEvent): void;
}
