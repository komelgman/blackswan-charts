import type { MousePositionEvent } from '@/components/layered-canvas/events';

export interface DragMoveEvent extends MousePositionEvent {
  dx: number;
  dy: number;
}
