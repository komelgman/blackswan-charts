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
  MousePositionEvent,
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
  (e: 'drag-end', event: MousePositionEvent): void;
  (e: 'mouse-move', event: MousePositionEvent): void;
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

function getMousePosRelativeToElement(e: MouseEvent, element?: Element): Point {
  const target = element || e.target;
  if (!(e instanceof MouseEvent) || !(target instanceof Element)) {
    throw new Error('Illegal argument: e instanceof MouseEvent)');
  }

  const rect = target.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onMouseLeftBtnClick(e: MouseEvent): void {
  if (!e.defaultPrevented && !isWasDrag) {
    e.preventDefault();

    const event: MouseClickEvent = { ...getMousePosRelativeToElement(e), isCtrl: e.ctrlKey };
    emit('left-mouse-btn-click', event);
  }
}

function onMouseLeftBtnDoubleClick(e: MouseEvent): void {
  if (!e.defaultPrevented) {
    e.preventDefault();

    const event: MouseClickEvent = { ...getMousePosRelativeToElement(e), isCtrl: e.ctrlKey };
    emit('left-mouse-btn-double-click', event);
  }
}

function onWheel(e: WheelEvent): void {
  if (!(e instanceof MouseEvent) || !(e.target instanceof Element)) {
    return;
  }

  const event: ZoomEvent = { pivot: getMousePosRelativeToElement(e), delta: e.deltaY };
  emit('zoom', event);
}

function onDragStart(e: MouseEvent): void {
  if (!e.defaultPrevented && e.target instanceof Element) {
    isDrag = true;
    isWasDrag = false;
    dragInElement = e.target;
    prevPos = getMousePosRelativeToElement(e);
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
    const startEvent: MouseClickEvent = {
      ...getMousePosRelativeToElement(e, dragInElement),
      isCtrl: e.ctrlKey,
    };
    emit('drag-start', startEvent);
    isWasDrag = true;
  }

  const pos: Point = getMousePosRelativeToElement(e, dragInElement);
  const moveEvent: DragMoveEvent = {
    ...pos,
    dx: prevPos.x - pos.x,
    dy: prevPos.y - pos.y,
  };
  emit('drag-move', moveEvent);
  prevPos = pos;

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

  const event: MousePositionEvent = getMousePosRelativeToElement(e);
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
      const event: MousePositionEvent = getMousePosRelativeToElement(e, dragInElement);
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
