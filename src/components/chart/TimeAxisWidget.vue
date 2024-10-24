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
import type { DragMoveEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/events';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { LayeredCanvasOptions } from '@/components/layered-canvas/types';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import TimeAxisLabelsLayer from '@/model/chart/layers/TimeAxisLabelsLayer';

interface Props {
  timeAxis: TimeAxis;
}

const { timeAxis } = defineProps<Props>();
const rootElement = ref<HTMLElement>();
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    new TimeAxisLabelsLayer(timeAxis),
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
  timeAxis.noHistoryManagedUpdate({ screenSize: { main: e.width, second: e.height } });
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
