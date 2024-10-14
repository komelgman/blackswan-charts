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
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import type { DragMoveEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/events';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { LayeredCanvasOptions } from '@/components/layered-canvas/types';
import type { ChartState } from '@/model/chart/Chart';
import PriceAxisLabelsLayer from '@/model/chart/layers/PriceAxisLabelsLayer';
import PriceAxisMarksLayer from '@/model/chart/layers/PriceAxisMarksLayer';
import type { Viewport } from '@/model/chart/viewport/Viewport';

interface Props {
  viewportModel: Viewport;
}

const { viewportModel } = defineProps<Props>();
const rootElement = ref<HTMLElement>();
const chartState = inject<ChartState>('chartState');
const marksLayer = new PriceAxisMarksLayer(viewportModel);
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    new PriceAxisLabelsLayer(viewportModel.priceAxis),
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
