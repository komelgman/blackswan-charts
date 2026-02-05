import type { Multipane, PaneSize } from '@/components/layout/types';

export default interface PanesSizeChangedEvent {
  source: Multipane<any>,
  initial: PaneSize[];
  changed: PaneSize[];
}
