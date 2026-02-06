<template>
  <div class="timeline pane">
    <layered-canvas
      :options="canvasOptions"
      @resize="onResize"

      @mouse-move="onMouseMove"
      @drag-start="onDragStart"
      @drag-move="onDrag"
      @drag-end="onDragEnd"
      @left-mouse-btn-click="onLeftMouseBtnClick"
      @left-mouse-btn-double-click="onLeftMouseBtnDoubleClick"
      @zoom="onZoom"
    />
  </div>
</template>

<script setup lang="ts">
import type { DragMoveEvent, MouseClickEvent, GenericMouseEvent, ResizeEvent, ZoomEvent } from '@blackswan/layered-canvas/model';
import { LayeredCanvas } from '@blackswan/layered-canvas/components';
import type { LayeredCanvasOptions } from '@blackswan/layered-canvas/model';
import { TimeAxisLabelsLayer } from '@/model/chart/axis/layers';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';

export interface Props {
  timeAxis: TimeAxis;
  interactionsHandler: InteractionsHandler<TimeAxis>;
}

const { timeAxis, interactionsHandler } = defineProps<Props>();
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    new TimeAxisLabelsLayer(timeAxis),
    // marks renderer
    // priceline label renderer
    // tool/crosshair label renderer
  ],
};

function onMouseMove(e: GenericMouseEvent): void {
  interactionsHandler.onMouseMove(timeAxis, e);
}

function onLeftMouseBtnClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnClick(timeAxis, e);
}

function onLeftMouseBtnDoubleClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnDoubleClick(timeAxis, e);
}

function onDragStart(e: MouseClickEvent): void {
  interactionsHandler.onDragStart(timeAxis, e);
}

function onDrag(e: DragMoveEvent): void {
  interactionsHandler.onDrag(timeAxis, e);
}

function onDragEnd(e: GenericMouseEvent): void {
  interactionsHandler.onDragEnd(timeAxis, e);
}

function onZoom(e: ZoomEvent): void {
  interactionsHandler.onZoom(timeAxis, e);
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
  cursor: col-resize;
  background-color: var(--time-axis-background-color, var(--primary-background-color));
}
</style>
