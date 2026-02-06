import type { GenericMouseEvent } from './GenericMouseEvent';

export interface ZoomEvent extends GenericMouseEvent {
  // tofo: try invert dependency, instead of provide delta, request delta at calculation moment
  screenDelta: number;
}
