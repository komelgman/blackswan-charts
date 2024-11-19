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
      ref="nativeLayers"
      v-for="(layer, index) in layers"
      :key="layer.id"
      :style="`user-select: none;-webkit-tap-highlight-color: transparent;z-index:${index}`"
    />
  </div>
</template>

<script setup lang="ts">
import ResizeObserver from 'resize-observer-polyfill';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import type {
  DragMoveEvent,
  MouseClickEvent,
  GenericMouseEvent,
  ResizeEvent,
  ZoomEvent,
} from '@/components/layered-canvas/events';
import type { LayeredCanvasOptions } from '@/components/layered-canvas/types';
import type { EventRemover } from '@/misc/document-listeners';
import { onceDocument, onDocument } from '@/misc/document-listeners';
import type { Point } from '@/model/chart/types';

interface Props {
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
const nativeLayers = ref<HTMLCanvasElement[]>([]);
const resizeObserver = new ResizeObserver(setupLayers);
const { layers } = props.options;
let prevPos: Point;
let removeMoveListener: EventRemover;
let removeEndListener: EventRemover;
let isSkipMovementsDetection = false;
let isSkipWheelDetection = false;
let isDrag = false;
let dragInElement: Element;
let isWasDrag = false;

onMounted(() => {
  if (!rootElement.value) {
    throw new Error('rootElement must be present');
  }

  resizeObserver.observe(rootElement.value);
});

onUnmounted(() => {
  resizeObserver.disconnect();
  onDragEnd();

  for (const layer of props.options.layers) {
    layer.clearListeners();
  }
});

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

  // hint: decrease amount of drag events
  setTimeout(() => {
    isSkipWheelDetection = false;
  }, 15);
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

  // hint: decrease amount of drag events
  setTimeout(() => {
    isSkipMovementsDetection = false;
  }, 10);
}

function onMouseMove(e: MouseEvent): void {
  if (isDrag || isSkipMovementsDetection) {
    return;
  }
  isSkipMovementsDetection = true;

  const event: GenericMouseEvent = buildGenericMouseEvent(e, e.target);
  emit('mouse-move', event);

  // hint: decrease amount of move events
  setTimeout(() => {
    isSkipMovementsDetection = false;
  }, 10);
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

function setupLayers(): void {
  nextTick().then(() => {
    if (!rootElement.value) {
      throw new Error('rootElement must be present');
    }

    const { width, height } = rootElement.value.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    for (let layerId = 0; layerId < nativeLayers.value.length; layerId += 1) {
      const layerCanvas: HTMLCanvasElement = nativeLayers.value[layerId];
      layerCanvas.style.width = `${width}px`;
      layerCanvas.style.height = `${height}px`;

      const context = layerCanvas.getContext('2d');
      if (!context) {
        throw new Error('context === null');
      }

      props.options.layers[layerId].setContext({
        native: context,
        width,
        height,
        dpr,
      });
    }

    emit('resize', { width, height });
  });
}
</script>

<style scoped lang="scss">
.layered-canvas {
  display: grid;
  width: 100%;
  height: 100%;

  canvas {
    width: 100%;
    height: 100%;
    grid-row: 1;
    grid-column: 1;
  }
}
</style>
