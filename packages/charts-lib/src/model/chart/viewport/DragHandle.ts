import type { DragMoveEvent } from '@blackswan/layered-canvas/model';

export interface DragHandle {
  (e: DragMoveEvent): void;
}
