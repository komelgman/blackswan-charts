<template>
  <div ref="rootElement" class="priceline pane" :style="cssVars">
    <layered-canvas
        :options="canvasOptions"
        @drag-move="onDrag"
        @zoom="onZoom"
        @resize="onResize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from 'vue';
import PriceAxisLabelsLayer from '@/components/chart/layers/PriceAxisLabelsLayer';
import PriceAxisMarksLayer from '@/components/chart/layers/PriceAxisMarksLayer';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { DragMoveEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import type LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type ChartState from '@/model/ChartState';
import type Viewport from '@/model/chart/viewport/Viewport';

interface Props {
  viewportModel: Viewport;
}

const { viewportModel } = defineProps<Props>();
const rootElement = ref<HTMLElement>();
const chartState = inject<ChartState>('chartState');
const labelsInvalidator = new PriceLabelsInvalidator(viewportModel.priceAxis);
const marksLayer = new PriceAxisMarksLayer(viewportModel);
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    createLabelsLayer(),
    marksLayer,
    // priceline mark renderer
    // tool/cross hair label renderer
  ],
};

onMounted(() => {
  marksLayer.installListeners();
});

onUnmounted(() => {
  marksLayer.uninstallListeners();
});

function onDrag(e: DragMoveEvent): void {
  viewportModel.priceAxis.zoom(rootElement.value!.getBoundingClientRect().height / 2, -e.dy);
}

function onZoom(e: ZoomEvent): void {
  viewportModel.priceAxis.zoom(e.pivot.y, e.delta);
}

function onResize(e: ResizeEvent): void {
  viewportModel.priceAxis.update({ screenSize: { main: e.height, second: e.width } });
}

function createLabelsLayer(): PriceAxisLabelsLayer {
  const { priceAxis } = viewportModel;
  const result: PriceAxisLabelsLayer = new PriceAxisLabelsLayer(priceAxis);

  result.addContextChangeListener((newCtx: LayerContext) => {
    labelsInvalidator.context = newCtx;
  });

  return result;
}

const cssVars = computed(() => {
  const widgetWidth = chartState!.priceWidgetWidth;

  return {
    '--widgetWidth': `${(widgetWidth)}px`,
  };
});
</script>

<style scoped>
.priceline {
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  width: var(--widgetWidth);
  max-width: var(--widgetWidth);
  min-width: var(--widgetWidth);
  cursor: n-resize;
}
</style>
