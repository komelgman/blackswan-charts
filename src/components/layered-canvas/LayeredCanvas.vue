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
        :style="'user-select: none;-webkit-tap-highlight-color: transparent;z-index:' + index"
    />
  </div>
</template>

<script setup lang="ts">
import type LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import type { EventRemover } from '@/misc/document-listeners';
import { onceDocument, onDocument } from '@/misc/document-listeners';
import type { Point } from '@/model/type-defs';
import ResizeObserver from 'resize-observer-polyfill';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

// todo extract to events
export interface MousePositionEvent {
  x: number;
  y: number;
}

export interface DragMoveEvent extends MousePositionEvent {
  dx: number;
  dy: number;
}

export interface MouseClickEvent extends MousePositionEvent {
  isCtrl: boolean;
}

export interface ZoomEvent {
  pivot: Point;
  delta: number;
}

export interface ResizeEvent {
  width: number;
  height: number;
}

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
// todo: check is ref needed
const prevPos = ref<Point>({ x: 0, y: 0 });
const removeMoveListener = ref<EventRemover>();
const removeEndListener = ref<EventRemover>();
const isSkipMovementsDetection = ref(false);
const isDrag = ref(false);
const dragInElement = ref<Element>();
const isWasDrag = ref(false);
const layers = props.options.layers;

onMounted(() => {
  if (!rootElement.value) {
    throw new Error("rootElement must be present");
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

function getPos(e: MouseEvent, element?: Element): Point {
  const target = element || e.target;
  if (!(e instanceof MouseEvent) || !(target instanceof Element)) {
    throw new Error('Illeagl argument: e instanceof MouseEvent)');
  }

  const rect = target.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onMouseLeftBtnClick(e: MouseEvent): void {
  if (!e.defaultPrevented && !isWasDrag.value) {
    e.preventDefault();

    const event: MouseClickEvent = { ...getPos(e), isCtrl: e.ctrlKey };
    emit('left-mouse-btn-click', event);
  }
}

function onMouseLeftBtnDoubleClick(e: MouseEvent): void {
  if (!e.defaultPrevented) {
    e.preventDefault();

    const event: MouseClickEvent = { ...getPos(e), isCtrl: e.ctrlKey };
    emit('left-mouse-btn-double-click', event);
  }
}

function onWheel(e: WheelEvent): void {
  if (!(e instanceof MouseEvent) || !(e.target instanceof Element)) {
    return;
  }

  const event: ZoomEvent = { pivot: getPos(e), delta: e.deltaY };
  emit('zoom', event);
}

function onDragStart(e: MouseEvent): void {
  if (!e.defaultPrevented && e.target instanceof Element) {
    isDrag.value = true;
    isWasDrag.value = false;
    dragInElement.value = e.target;
    prevPos.value = getPos(e);
    removeMoveListener.value = onDocument('mousemove', onDragMove, true);
    removeEndListener.value = onceDocument('mouseup', onDragEnd);
  }
}

function onDragMove(e: MouseEvent): void {
  if (!isDrag.value || isSkipMovementsDetection.value) {
    return;
  }
  isSkipMovementsDetection.value = true;

  if (!isWasDrag.value) {
    const startEvent: MouseClickEvent = {
      ...getPos(e, dragInElement.value),
      isCtrl: e.ctrlKey,
    };
    emit('drag-start', startEvent);
    isWasDrag.value = true;
  }

  const pos: Point = getPos(e, dragInElement.value);
  const moveEvent: DragMoveEvent = {
    ...pos,
    dx: prevPos.value.x - pos.x,
    dy: prevPos.value.y - pos.y,
  };
  emit('drag-move', moveEvent);
  prevPos.value = pos;

  // hint: decrease amount of drag events
  setTimeout(() => {
    isSkipMovementsDetection.value = false;
  }, 10);
}

function onMouseMove(e: MouseEvent): void {
  if (isDrag.value || isSkipMovementsDetection.value) {
    return;
  }
  isSkipMovementsDetection.value = true;

  const event: MousePositionEvent = getPos(e);
  emit('mouse-move', event);

  // hint: decrease amount of move events
  setTimeout(() => {
    isSkipMovementsDetection.value = false;
  }, 10);
}

function onDragEnd(e?: DragEvent): void {
  isDrag.value = false;

  if (e === undefined || !e.defaultPrevented) {
    if (e !== undefined && isWasDrag.value) {
      e.preventDefault();
      const event: MousePositionEvent = getPos(e, dragInElement.value);
      emit('drag-end', event);
    }

    if (typeof removeMoveListener.value === 'function') {
      removeMoveListener.value();
    }

    if (typeof removeEndListener.value === 'function') {
      removeEndListener.value();
    }
  }
}

function setupLayers(): void {
  nextTick().then(() => {
    if (!rootElement.value) {
      throw new Error("rootElement must be present");
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
