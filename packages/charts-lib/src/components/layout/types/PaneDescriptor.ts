import type { PaneId } from '@/components/layout/types';

export interface PaneDescriptor<T> {
  id: PaneId;
  model: T;
  size?: number;
  // in fractions of a unit (1 - is 100% of multipane size, 0.1 - 10% of multipane size)
  preferredSize?: number;
  // absolute size in pixels
  minSize?: number;
  // absolute size in pixels; todo: deprecated
  maxSize?: number;
  visible: boolean;
}
