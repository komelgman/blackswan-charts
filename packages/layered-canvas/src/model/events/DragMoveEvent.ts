import type { GenericMouseEvent } from './GenericMouseEvent';

export interface DragMoveEvent extends GenericMouseEvent {
  // tofo: try invert dependency, instead of provide delta, request delta at calculation moment
  dx: number;
  dy: number;
}
