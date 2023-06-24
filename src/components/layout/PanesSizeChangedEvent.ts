import type Multipane from '@/components/layout/Multipane.vue';

export interface PaneSize {
  preferred?: number;
  current: number;
}

export interface PanesSizeChangeEvent {
  source: Multipane<any>,
  initial: PaneSize[];
  changed: PaneSize[];
}
