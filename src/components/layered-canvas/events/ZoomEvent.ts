import type { GenericMouseEvent } from './GenericMouseEvent';

export interface ZoomEvent extends GenericMouseEvent {
  screenDelta: number;
}
