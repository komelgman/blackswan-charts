import type LayerContext from '@/components/layered-canvas/layers/LayerContext';

export default interface LayerContextChangeListener {
  (newCtx: LayerContext): void;
}
