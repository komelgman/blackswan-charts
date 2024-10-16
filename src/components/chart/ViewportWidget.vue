<template>
  <div
    class="viewport"
    :style="cssVars"
  >
    <layered-canvas
      :options="canvasOptions"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @drag-move="onDrag"
      @mouse-move="onMouseMove"
      @zoom="onZoom"
      @left-mouse-btn-double-click="onLeftMouseBtnDoubleClick"
      @left-mouse-btn-click="onLeftMouseBtnClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, toRaw } from 'vue';
import type { DragMoveEvent, MouseClickEvent, MousePositionEvent, ZoomEvent } from '@/components/layered-canvas/events';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { LayerContext, LayeredCanvasOptions } from '@/components/layered-canvas/types';
import ViewportDataSourceLayer from '@/model/chart/layers/ViewportDataSourceLayer';
import ViewportGridLayer from '@/model/chart/layers/ViewportGridLayer';
import ViewportHighlightingLayer from '@/model/chart/layers/ViewportHighlightingLayer';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import ViewportHighlightInvalidator from '@/model/chart/viewport/ViewportHighlightInvalidator';
import { DataSourceChangeEventReason, type DataSourceChangeEventsMap } from '@/model/datasource/events';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';

interface Props {
  viewportModel: Viewport;
}

const { viewportModel } = defineProps<Props>();
const highlightInvalidator = new ViewportHighlightInvalidator(viewportModel);
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
  if (events.has(DataSourceChangeEventReason.RemoveEntry)) {
    const { selected, highlighted } = toRaw(viewportModel);
    const removedEntriesEvents = events.get(DataSourceChangeEventReason.RemoveEntry) || [];

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
  highlightInvalidator.invalidate(e);
}

function onLeftMouseBtnDoubleClick(): void {
  const { highlighted } = viewportModel;
  if (highlighted !== undefined) {
    console.log(`double click on element: ${highlighted.descriptor.ref}`);
  } else {
    console.log('double click on viewport');
  }
}

function onLeftMouseBtnClick(e: MouseClickEvent): void {
  viewportModel.updateSelection(e.isCtrl);
}

function onDragStart(e: MouseClickEvent): void {
  viewportModel.updateSelection(e.isCtrl, true);

  if (viewportModel.selectionCanBeDragged()) {
    viewportModel.dataSource.beginTransaction({ incident: 'drag-in-viewport' });

    if (e.isCtrl) {
      viewportModel.cloneSelected();
    }
  }

  viewportModel.updateDragHandle();
}

function onDrag(e: DragMoveEvent): void {
  if (viewportModel.selectionCanBeDragged()) {
    highlightInvalidator.invalidate(e);
    viewportModel.moveSelected(e);
  } else {
    const { timeAxis, priceAxis } = viewportModel;
    timeAxis.move(e.dx);
    priceAxis.move(e.dy);
  }
}

function onDragEnd(): void {
  const { dataSource } = viewportModel;
  if (viewportModel.selectionCanBeDragged()) {
    dataSource.endTransaction();
  } else {
    dataSource.historicalIncidentReportProcessor({
      protocolOptions: { incident: 'move-in-viewport' },
      sign: true,
    });
  }
}

function onZoom(e: ZoomEvent): void {
  viewportModel.timeAxis.zoom(e.pivot.x, e.delta);
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
