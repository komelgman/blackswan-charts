import type Multipane from '@/components/layout/Multipane.vue';

export interface PanesSizeChangeEvent {
  source: Multipane<any>,
  initial: number[];
  changed: number[];
}
