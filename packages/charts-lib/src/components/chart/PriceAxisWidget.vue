<template>
  <div class="priceline pane" :style="cssVars">
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
import { computed, inject } from 'vue';
import type { DragMoveEvent, MouseClickEvent, GenericMouseEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/events';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { LayeredCanvasOptions } from '@/components/layered-canvas/types';
import type { ChartWidgetSharedState } from '@/components/chart/ChartWidget.vue';
import type DataSource from '@/model/datasource/DataSource';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';
import { PriceAxisLabelsLayer, PriceAxisMarksLayer } from '@/model/chart/axis/layers';

export interface Props {
  priceAxis: PriceAxis;
  dataSource: DataSource;
  interactionsHandler: InteractionsHandler<PriceAxis>;
}

const { priceAxis, dataSource, interactionsHandler } = defineProps<Props>();
const chartState = inject<ChartWidgetSharedState>('chartState');
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    new PriceAxisLabelsLayer(priceAxis),
    new PriceAxisMarksLayer(dataSource, priceAxis),
    // priceline mark renderer
    // tool/cross hair label renderer
  ],
};

function onMouseMove(e: GenericMouseEvent): void {
  interactionsHandler.onMouseMove(priceAxis, e);
}

function onLeftMouseBtnClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnClick(priceAxis, e);
}

function onLeftMouseBtnDoubleClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnDoubleClick(priceAxis, e);
}

function onDragStart(e: MouseClickEvent): void {
  interactionsHandler.onDragStart(priceAxis, e);
}

function onDrag(e: DragMoveEvent): void {
  interactionsHandler.onDrag(priceAxis, e);
}

function onDragEnd(e: GenericMouseEvent): void {
  interactionsHandler.onDragEnd(priceAxis, e);
}

function onZoom(e: ZoomEvent): void {
  interactionsHandler.onZoom(priceAxis, e);
}

function onResize(e: ResizeEvent): void {
  priceAxis.noHistoryManagedUpdate({ screenSize: { main: e.height, second: e.width } });
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
  cursor: row-resize;
  background-color: var(--price-axis-background-color, var(--primary-background-color));
}
</style>
