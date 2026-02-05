<template>
  <div class="resize-handle" @mousedown="onDragStart"/>
</template>

<script lang="ts" setup>
import type { ResizeHandleMoveEvent } from '@/components/layout/events';
import { onceDocument, onDocument } from '@/model/misc/document-listeners';
import type { Point } from '@/model/chart/types';

export interface Props {
  index: number;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: 'resize-move', dPos: ResizeHandleMoveEvent) => void>();

let dragBlocked = false;
let startPos: Point;
let prevPos: Point;
let removeMoveListener: any;
let removeEndListener: any;

function onDragStart(e: MouseEvent): void {
  dragBlocked = false;
  if (!e.defaultPrevented) {
    e.preventDefault();

    startPos = { x: e.x, y: e.y };
    prevPos = { x: e.x, y: e.y };

    removeMoveListener = onDocument('mousemove', onDrag);
    removeEndListener = onceDocument('mouseup', onDragEnd);
  }
}

function onDrag(e: DragEvent): void {
  const dPos = {
    preventDrag: () => { dragBlocked = false; },
    allowDrag: () => { dragBlocked = true; },
    index: props.index,
    dx: e.x - prevPos.x,
    dy: e.y - prevPos.y,
    from: { ...startPos },
    changeX: e.x - startPos.x,
    changeY: e.y - startPos.y,
  } as ResizeHandleMoveEvent;

  if (!dragBlocked) {
    prevPos = { x: e.x, y: e.y };
  }
  dragBlocked = false;

  emit('resize-move', dPos);
}

function onDragEnd(e?: DragEvent): void {
  if (e !== undefined) {
    e.preventDefault();
  }

  if (typeof removeMoveListener === 'function') {
    removeMoveListener();
    removeMoveListener = undefined;
  }

  if (typeof removeEndListener === 'function') {
    removeEndListener();
    removeEndListener = undefined;
  }
}
</script>

<style lang="scss">
$resize-bg-color: var(--resize-handle-color-on-hover);

.layout-vertical > {
  .divider > {
    .resize-handle {
      position: relative;
      cursor: row-resize;
      height: 9px;
      left: 0;
      top: -5px;
      width: 100%;
      z-index: 50;

      &:hover {
        background-color: $resize-bg-color;
      }
    }
  }
}

.layout-horizontal > {
  .divider > {
    .resize-handle {
      position: relative;
      cursor: col-resize;
      width: 9px;
      top: 0;
      left: -5px;
      height: 100%;
      z-index: 50;

      &:hover {
        background-color: $resize-bg-color;
      }
    }
  }
}
</style>
