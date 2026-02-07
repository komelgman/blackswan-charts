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
import type { DragMoveEvent, MouseClickEvent, GenericMouseEvent, ZoomEvent, LayeredCanvasOptions } from '@blackswan/layered-canvas/model';
import { LayeredCanvas } from '@blackswan/layered-canvas/components';
import ViewportDataSourceLayer from '@/model/chart/viewport/layers/ViewportDataSourceLayer';
import ViewportGridLayer from '@/model/chart/viewport/layers/ViewportGridLayer';
import ViewportHighlightingLayer from '@/model/chart/viewport/layers/ViewportHighlightingLayer';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';

export interface Props {
  viewport: Viewport;
  interactionsHandler: InteractionsHandler<Viewport>;
}

const { viewport, interactionsHandler } = defineProps<Props>();

const canvasOptions: LayeredCanvasOptions = {
  layers: [
    new ViewportGridLayer(viewport.timeAxis, viewport.priceAxis),
    new ViewportDataSourceLayer(viewport),
    new ViewportHighlightingLayer(viewport),
  ],
};

onMounted(() => {
  viewport.installListeners();
});

onUnmounted(() => {
  viewport.uninstallListeners();
});

function onMouseMove(e: GenericMouseEvent): void {
  interactionsHandler.onMouseMove(viewport, e);
}

function onLeftMouseBtnClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnClick(viewport, e);
}

function onLeftMouseBtnDoubleClick(e: MouseClickEvent): void {
  interactionsHandler.onLeftMouseBtnDoubleClick(viewport, e);
}

function onDragStart(e: MouseClickEvent): void {
  interactionsHandler.onDragStart(viewport, e);
}

function onDrag(e: DragMoveEvent): void {
  interactionsHandler.onDrag(viewport, e);
}

function onDragEnd(e: GenericMouseEvent): void {
  interactionsHandler.onDragEnd(viewport, e);
}

function onZoom(e: ZoomEvent): void {
  interactionsHandler.onZoom(viewport, e);
}

const cssVars = computed(() => {
  const cursor: string = viewport.cursor || 'default';
  return {
    '--viewport-cursor': cursor,
  };
});
</script>

<style scoped>
.viewport {
  display: flex;
  flex: 1 1 auto;
  background-color: var(--viewport-background-color, var(--primary-background-color));
  cursor: var(--viewport-cursor, default);
}
</style>
