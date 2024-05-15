import type { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';

export interface DragHandle {
  (e: DragMoveEvent): void;
}
