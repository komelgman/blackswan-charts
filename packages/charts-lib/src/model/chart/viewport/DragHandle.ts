import type { DragMoveEvent } from '@/components/layered-canvas/events';

export interface DragHandle {
  (e: DragMoveEvent): void;
}
