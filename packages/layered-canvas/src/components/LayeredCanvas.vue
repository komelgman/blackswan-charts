<template>
  <div
    ref="rootElement"
    class="layered-canvas"
    @mousedown.left="onDragStart"
    @dblclick.left="onMouseLeftBtnDoubleClick"
    @wheel.passive="onWheel"
    @mousemove="onMouseMove"
    @click.left="onMouseLeftBtnClick"
  >
    <canvas
      ref="utilityCanvas"
      class="layered-canvas__utility"
    />

    <canvas
      ref="nativeLayers"
      v-for="(layer, index) in layers"
      :key="layer.id"
      class="layered-canvas__layer"
      :style="{ '--layer-index': index }"
    />
  </div>
</template>

<script setup lang="ts">
import ResizeObserver from 'resize-observer-polyfill';
import { onMounted, onUnmounted, ref } from 'vue';
import type {
  DragMoveEvent,
  MouseClickEvent,
  GenericMouseEvent,
  ResizeEvent,
  ZoomEvent,
} from '../model/events';
import type { LayeredCanvasOptions } from '../model/types';
import { onceDocument, onDocument, type EventRemover, type Point } from 'blackswan-foundation';

export interface Props {
  options: LayeredCanvasOptions;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'left-mouse-btn-click', event: MouseClickEvent): void;
  (e: 'left-mouse-btn-double-click', event: MouseClickEvent): void;
  (e: 'zoom', event: ZoomEvent): void;
  (e: 'drag-start', event: MouseClickEvent): void;
  (e: 'drag-move', event: DragMoveEvent): void;
  (e: 'drag-end', event: GenericMouseEvent): void;
  (e: 'mouse-move', event: GenericMouseEvent): void;
  (e: 'resize', event: ResizeEvent): void;
}>();

const rootElement = ref<HTMLElement>();
const utilityCanvas = ref<HTMLCanvasElement>();
const nativeLayers = ref<HTMLCanvasElement[]>([]);
const resizeObserver = new ResizeObserver(updateLayersContext);
const { layers } = props.options;
let prevPos: Point;
let removeMoveListener: EventRemover;
let removeEndListener: EventRemover;
let isSkipMovementsDetection = false;
let isSkipWheelDetection = false;
let isDrag = false;
let dragInElement: Element;
let isWasDrag = false;
let utilityCanvasContext: CanvasRenderingContext2D;

onMounted(() => {
  if (!rootElement.value) {
    throw new Error('rootElement must be present');
  }

  utilityCanvasContext = utilityCanvas.value?.getContext('2d') as CanvasRenderingContext2D;

  resizeObserver.observe(rootElement.value);

  for (const layer of props.options.layers) {
    layer.init();
  }
});

onUnmounted(() => {
  resizeObserver.disconnect();
  onDragEnd();

  for (const layer of props.options.layers) {
    layer.destroy();
  }
});

function updateLayersContext(): void {
  if (!rootElement.value) {
    throw new Error('rootElement must be present');
  }

  if (!utilityCanvas.value) {
    throw new Error('utilityCanvas must be present');
  }

  const { width, height } = rootElement.value.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  utilityCanvas.value.style.width = `${width}px`;
  utilityCanvas.value.style.height = `${height}px`;

  for (let layerId = 0; layerId < nativeLayers.value.length; layerId += 1) {
    const layerCanvas: HTMLCanvasElement = nativeLayers.value[layerId];
    layerCanvas.style.width = `${width}px`;
    layerCanvas.style.height = `${height}px`;

    props.options.layers[layerId].updateContext({
      mainCanvas: layerCanvas,
      utilityCanvasContext,
      width,
      height,
      dpr,
    });
  }

  emit('resize', { width, height });
}

function buildGenericMouseEvent(e: MouseEvent, element: Element | EventTarget | null): GenericMouseEvent {
  if (!(e instanceof MouseEvent) || !(element instanceof Element)) {
    throw new Error('Illegal arguments: e instanceof MouseEvent && element instanceof Element)');
  }

  const rect = element.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    elementHeight: rect.height,
    elementWidth: rect.width,
    isAltPressed: e.altKey,
    isCtrlPressed: e.ctrlKey,
    isShiftPressed: e.shiftKey,
  };
}

function onMouseLeftBtnClick(e: MouseEvent): void {
  if (!e.defaultPrevented && !isWasDrag) {
    e.preventDefault();

    const event: MouseClickEvent = buildGenericMouseEvent(e, e.target);
    emit('left-mouse-btn-click', event);
  }
}

function onMouseLeftBtnDoubleClick(e: MouseEvent): void {
  if (!e.defaultPrevented) {
    e.preventDefault();

    const event: MouseClickEvent = buildGenericMouseEvent(e, e.target);
    emit('left-mouse-btn-double-click', event);
  }
}

function onWheel(e: WheelEvent): void {
  if (!(e instanceof MouseEvent) || !(e.target instanceof Element) || isSkipWheelDetection) {
    return;
  }
  isSkipWheelDetection = true;

  const event: ZoomEvent = { ...buildGenericMouseEvent(e, e.target), screenDelta: e.deltaY };
  emit('zoom', event);

  setTimeout(resetSkipWeelDetection, 15);
}

function resetSkipWeelDetection(): void {
  isSkipWheelDetection = false;
}

function onDragStart(e: MouseEvent): void {
  if (!e.defaultPrevented && e.target instanceof Element) {
    isDrag = true;
    isWasDrag = false;
    dragInElement = e.target;
    prevPos = buildGenericMouseEvent(e, e.target);
    removeMoveListener = onDocument('mousemove', onDragMove, true);
    removeEndListener = onceDocument('mouseup', onDragEnd);
  }
}

function onDragMove(e: MouseEvent): void {
  if (!isDrag || isSkipMovementsDetection) {
    return;
  }
  isSkipMovementsDetection = true;

  if (!isWasDrag) {
    const startEvent: MouseClickEvent = buildGenericMouseEvent(e, dragInElement);
    emit('drag-start', startEvent);
    isWasDrag = true;
  }

  const simpleEvent: GenericMouseEvent = buildGenericMouseEvent(e, dragInElement);
  const moveEvent: DragMoveEvent = {
    ...simpleEvent,
    dx: prevPos.x - simpleEvent.x,
    dy: prevPos.y - simpleEvent.y,
  };
  emit('drag-move', moveEvent);
  prevPos = simpleEvent;

  setTimeout(resetSkipMovementDetection, 10); // todo: options
}

function onMouseMove(e: MouseEvent): void {
  if (isDrag || isSkipMovementsDetection) {
    return;
  }
  isSkipMovementsDetection = true;

  const event: GenericMouseEvent = buildGenericMouseEvent(e, e.target);
  emit('mouse-move', event);

  setTimeout(resetSkipMovementDetection, 10); // todo: options
}

function resetSkipMovementDetection(): void {
  isSkipMovementsDetection = false;
}

function onDragEnd(e?: DragEvent): void {
  isDrag = false;

  if (e === undefined || !e.defaultPrevented) {
    if (e !== undefined && isWasDrag) {
      e.preventDefault();
      const event: GenericMouseEvent = buildGenericMouseEvent(e, dragInElement);
      emit('drag-end', event);
    }

    if (typeof removeMoveListener === 'function') {
      removeMoveListener();
    }

    if (typeof removeEndListener === 'function') {
      removeEndListener();
    }
  }
}
</script>

<style scoped lang="scss">
.layered-canvas {
  display: grid;
  width: 100%;
  height: 100%;

  .layered-canvas__utility,
  .layered-canvas__layer {
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .layered-canvas__utility {
    z-index: 0;
  }

  .layered-canvas__layer {
    z-index: var(--layer-index);
  }

  canvas {
    width: 100%;
    height: 100%;
    grid-row: 1;
    grid-column: 1;
  }
}
</style>
