<template>
  <div ref="rootElement" class="timeline pane">
    <layered-canvas
        :options="canvasOptions"
        @drag-move="onDrag"
        @zoom="onZoom"
        @resize="onResize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TimeAxisLabelsLayer from '@/components/chart/layers/TimeAxisLabelsLayer';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { DragMoveEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import type LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import TimeLabelsInvalidator from '@/model/chart/axis/label/TimeLabelsInvalidator';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

interface Props {
  timeAxis: TimeAxis;
}

const { timeAxis } = defineProps<Props>();
const rootElement = ref<HTMLElement>();
const labelsInvalidator: TimeLabelsInvalidator = new TimeLabelsInvalidator(timeAxis);
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    createLabelsLayer(),
    // marks renderer
    // priceline label renderer
    // tool/crosshair label renderer

  ],
};

function onDrag(e: DragMoveEvent): void {
  timeAxis.zoom(rootElement.value!.getBoundingClientRect().width / 2, -e.dx);
}

function onZoom(e: ZoomEvent): void {
  timeAxis.zoom(e.pivot.x, e.delta);
}

function onResize(e: ResizeEvent): void {
  timeAxis.update({ screenSize: { main: e.width, second: e.height } });
}

function createLabelsLayer(): TimeAxisLabelsLayer {
  const result: TimeAxisLabelsLayer = new TimeAxisLabelsLayer(timeAxis);

  result.addContextChangeListener((newCtx: LayerContext) => {
    labelsInvalidator.context = newCtx;
  });

  return result;
}
</script>


<style scoped>
.timeline {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  cursor: w-resize;
}
</style>
