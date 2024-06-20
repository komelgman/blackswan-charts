import type { PaneDescriptor } from '@/components/layout/types';

export declare type Multipane<T> = {
  invalidate: () => void;
  visibleItems: PaneDescriptor<T>[];
}
