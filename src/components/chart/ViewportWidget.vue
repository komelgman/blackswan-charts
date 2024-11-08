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
import type { DragMoveEvent, MouseClickEvent, MousePositionEvent, ZoomEvent } from '@/components/layered-canvas/events';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { LayerContext, LayeredCanvasOptions } from '@/components/layered-canvas/types';
import ViewportDataSourceLayer from '@/model/chart/layers/ViewportDataSourceLayer';
import ViewportGridLayer from '@/model/chart/layers/ViewportGridLayer';
import ViewportHighlightingLayer from '@/model/chart/layers/ViewportHighlightingLayer';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';
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
  viewportModel.dataSource.addChangeEventListener(dataSourceChangeEventListener);
});

onUnmounted(() => {
  dataSourceInvalidator.uninstallListeners();
  dataSourceLayer.uninstallListeners();
  highlightingLayer.uninstallListeners();
  viewportModel.dataSource.removeChangeEventListener(dataSourceChangeEventListener);
});

function dataSourceChangeEventListener(events: DataSourceChangeEventsMap): void {
  const removedEntriesEvents = events.get(DataSourceChangeEventReason.RemoveEntry) || [];
  if (removedEntriesEvents.length > 0) {
    const { selected, highlighted } = viewportModel;

    for (const event of removedEntriesEvents) {
      if (highlighted === event.entry) {
        viewportModel.resetHightlightes();
      }

      if (selected.has(event.entry)) {
        selected.delete(event.entry);
      }
    }
  }
}

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

function onMouseMove(e: MousePositionEvent): void {
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

function onDragEnd(e: MousePositionEvent): void {
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
