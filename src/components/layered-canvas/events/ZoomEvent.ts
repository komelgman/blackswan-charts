import type { GenericMouseEvent } from '@/components/layered-canvas/events';

export interface ZoomEvent extends GenericMouseEvent {
  screenDelta: number;
}
