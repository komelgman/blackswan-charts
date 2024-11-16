<template>
  <div
    class="viewport"
    :style="cssVars"
  >
    <layered-canvas
      :options="canvasOptions"

      @mouse-move="onMouseMove"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @drag-move="onDrag"
      @left-mouse-btn-click="onLeftMouseBtnClick"
      @left-mouse-btn-double-click="onLeftMouseBtnDoubleClick"
      @zoom="onZoom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import type { DragMoveEvent, MouseClickEvent, GenericMouseEvent, ZoomEvent } from '@/components/layered-canvas/events';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { LayerContext, LayeredCanvasOptions } from '@/components/layered-canvas/types';
import ViewportDataSourceLayer from '@/model/chart/layers/ViewportDataSourceLayer';
import ViewportGridLayer from '@/model/chart/layers/ViewportGridLayer';
import ViewportHighlightingLayer from '@/model/chart/layers/ViewportHighlightingLayer';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';

interface Props {
  viewportModel: Viewport;
  interactionsHandler: InteractionsHandler<Viewport>;
}

const { viewportModel, interactionsHandler } = defineProps<Props>();
const { highlightInvalidator } = viewportModel;
const dataSourceInvalidator = new DataSourceInvalidator(viewportModel);

const dataSourceLayer = createDataSourceLayer();
const highlightingLayer = createHighlightingLayer();
const canvasOptions: LayeredCanvasOptions = {
  layers: [
    createGridLayer(),
    dataSourceLayer,
    // priceline renderer
    highlightingLayer,
    // tool/crosshair renderer ??? shared with other panes
  ],
};

onMounted(() => {
  dataSourceInvalidator.installListeners();
  dataSourceLayer.installListeners();
  highlightingLayer.installListeners();
  viewportModel.installListeners();
});

onUnmounted(() => {
  dataSourceInvalidator.uninstallListeners();
  dataSourceLayer.uninstallListeners();
  highlightingLayer.uninstallListeners();
  viewportModel.uninstallListeners();
});

function createGridLayer(): ViewportGridLayer {
  const { timeAxis, priceAxis } = viewportModel;
  return new ViewportGridLayer(timeAxis, priceAxis);
}

function createDataSourceLayer(): ViewportDataSourceLayer {
  const { dataSource, priceAxis } = viewportModel;
  const result: ViewportDataSourceLayer = new ViewportDataSourceLayer(dataSource, priceAxis.inverted);

  result.addContextChangeListener((newCtx: LayerContext) => {
    highlightInvalidator.layerContext = newCtx;
    dataSourceInvalidator.context = newCtx;
  });

  return result;
}

function createHighlightingLayer(): ViewportHighlightingLayer {
  return new ViewportHighlightingLayer(viewportModel);
}

function onMouseMove(e: GenericMouseEvent): void {
  interactionsHandler.onMouseMove(viewportModel, e);
}

function onLeftMouseBtnClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnClick(viewportModel, e);
}

function onLeftMouseBtnDoubleClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnDoubleClick(viewportModel, e);
}

function onDragStart(e: MouseClickEvent): void {
  interactionsHandler.onDragStart(viewportModel, e);
}

function onDrag(e: DragMoveEvent): void {
  interactionsHandler.onDrag(viewportModel, e);
}

function onDragEnd(e: GenericMouseEvent): void {
  interactionsHandler.onDragEnd(viewportModel, e);
}

function onZoom(e: ZoomEvent): void {
  interactionsHandler.onZoom(viewportModel, e);
}

const cssVars = computed(() => {
  const cursor: string = viewportModel.cursor || 'default';
  return {
    cursor: `${cursor} !important`,
  };
});
</script>

<style scoped>
.viewport {
  display: flex;
  flex: 1 1 auto;
}
</style>
