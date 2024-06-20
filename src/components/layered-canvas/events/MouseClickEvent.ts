import type { MousePositionEvent } from '@/components/layered-canvas/events';

export interface MouseClickEvent extends MousePositionEvent {
  isCtrl: boolean;
}
