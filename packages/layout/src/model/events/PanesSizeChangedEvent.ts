import type { Multipane, PaneSize } from '../types';

export default interface PanesSizeChangedEvent {
  source: Multipane<any>,
  initial: PaneSize[];
  changed: PaneSize[];
}
