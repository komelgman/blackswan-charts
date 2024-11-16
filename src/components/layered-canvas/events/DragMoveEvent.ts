import type { GenericMouseEvent } from '@/components/layered-canvas/events';

export interface DragMoveEvent extends GenericMouseEvent {
  dx: number;
  dy: number;
}
