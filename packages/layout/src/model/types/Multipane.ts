import type { PaneDescriptor } from './PaneDescriptor';

export declare type Multipane<T> = {
  invalidate: () => void;
  visibleItems: PaneDescriptor<T>[];
};
