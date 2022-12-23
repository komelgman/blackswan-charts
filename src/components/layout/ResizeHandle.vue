<template>
  <div class="resize-handle" @mousedown="dragStart"/>
</template>

<script lang="ts">
import type { ResizeHandleMoveEvent } from '@/components/layout';
import { onceDocument, onDocument } from '@/misc/document-listeners';
import type { Point } from '@/model/type-defs';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Options({})
export default class ResizeHandle extends Vue {
  @Prop({ required: true, type: Number })
  private index!: number;

  dragBlocked: boolean = false;
  startPos!: Point;
  prevPos!: Point;
  removeMoveListener!: any;
  removeEndListener!: any;

  private dragStart(e: MouseEvent): void {
    this.dragBlocked = false;
    if (!e.defaultPrevented) {
      e.preventDefault();

      this.startPos = { x: e.x, y: e.y };
      this.prevPos = { x: e.x, y: e.y };

      this.removeMoveListener = onDocument('mousemove', this.drag);
      this.removeEndListener = onceDocument('mouseup', this.dragEnd);
    }
  }

  private drag(e: DragEvent): void {
    const dPos = {
      sender: this,
      index: this.index,
      dx: e.x - this.prevPos.x,
      dy: e.y - this.prevPos.y,
      from: { ...this.startPos },
      changeX: e.x - this.startPos.x,
      changeY: e.y - this.startPos.y,
    } as ResizeHandleMoveEvent;

    if (!this.dragBlocked) {
      this.prevPos = { x: e.x, y: e.y };
    }
    this.dragBlocked = false;

    this.$emit('resize-move', dPos);
  }

  private dragEnd(e?: DragEvent): void {
    if (e !== undefined) {
      e.preventDefault();
    }

    if (typeof this.removeMoveListener === 'function') {
      this.removeMoveListener();
    }

    if (typeof this.removeEndListener === 'function') {
      this.removeEndListener();
    }
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
