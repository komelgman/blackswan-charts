<template>
  <div
    class="layered-canvas"
    @mousedown.left="onDragStart"
    @dblclick.left="onDoubleClick"
    @wheel.passive="onWheel"
    @mousemove="onMouseMove"
  >
    <canvas
      ref="nativeLayers"
      v-for="(layer, index) in layers"
      :key="layer.id"
      :style="'z-index:' + index"
    />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop, Ref } from 'vue-property-decorator';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import { PropType } from 'vue';
import ResizeObserver from 'resize-observer-polyfill';
import Layer from '@/components/layered-canvas/layers/Layer';
import { onceDocument, onDocument } from '@/misc/document-listeners';
import { Point } from '@/model/type-defs';

export interface DragMoveEvent {
  dx: number;
  dy: number;
}

export interface MouseMoveEvent {
  x: number;
  y: number;
}

export interface MouseClickEvent {
  x: number;
  y: number;
}

export interface ZoomEvent {
  pivot: number;
  delta: number;
}

export interface ResizeEvent {
  width: number;
  height: number;
}

@Options({})
export default class LayeredCanvas extends Vue {
  @Prop({ type: Object as PropType<LayeredCanvasOptions>, required: true })
  private options!: LayeredCanvasOptions;

  @Ref('nativeLayers')
  private nativeLayers!: HTMLCanvasElement[];

  private resizeObserver!: ResizeObserver;
  private prevPos!: Point;
  private removeMoveListener!: any;
  private removeEndListener!: any;
  private isSkipMovementsDetection: boolean = false;
  private isOnDrag: boolean = false;

  created(): void {
    this.resizeObserver = new ResizeObserver(this.setupLayers);
  }

  mounted(): void {
    this.resizeObserver.observe(this.$el);
  }

  unmounted(): void {
    this.resizeObserver.disconnect();
    this.onDragEnd();

    for (const layer of this.layers) {
      layer.clearListeners();
    }
  }

  get layers(): Layer[] {
    return this.options.layers;
  }

  private onDoubleClick(e: MouseEvent): void {
    if (!e.defaultPrevented) {
      e.preventDefault();

      this.$emit('double-click', { x: e.x, y: e.y });
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!(e instanceof MouseEvent) || !(e.target instanceof Element)) {
      return;
    }

    const rect: DOMRect = e.target.getBoundingClientRect();
    this.$emit('zoom', { pivot: e.pageY - rect.top, delta: e.deltaY });
  }

  private onDragStart(e: MouseEvent): void {
    if (!e.defaultPrevented) {
      e.preventDefault();

      this.isOnDrag = true;
      this.prevPos = { x: e.x, y: e.y };
      this.removeMoveListener = onDocument('mousemove', this.onDragMove, true);
      this.removeEndListener = onceDocument('mouseup', this.onDragEnd);
      this.$emit('drag-start', { x: e.x, y: e.y });
    }
  }

  private onDragMove(e: MouseEvent): void {
    if (this.isSkipMovementsDetection) {
      return;
    }
    this.isSkipMovementsDetection = true;

    this.$emit('drag-move', { dx: this.prevPos.x - e.x, dy: this.prevPos.y - e.y });
    this.prevPos = { x: e.x, y: e.y };

    // hint: decrease amount of drag events
    setTimeout(() => { this.isSkipMovementsDetection = false; }, 10);
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isOnDrag || this.isSkipMovementsDetection) {
      return;
    }
    this.isSkipMovementsDetection = true;

    this.$emit('mouse-move', { x: e.x, y: e.y });

    // hint: decrease amount of move events
    setTimeout(() => { this.isSkipMovementsDetection = false; }, 10);
  }

  private onDragEnd(e?: DragEvent): void {
    this.isOnDrag = false;

    if (e === undefined || !e.defaultPrevented) {
      if (e !== undefined) {
        e.preventDefault();
        this.$emit('drag-end', { x: e.x, y: e.y });
      }

      if (typeof this.removeMoveListener === 'function') {
        this.removeMoveListener();
      }

      if (typeof this.removeEndListener === 'function') {
        this.removeEndListener();
      }
    }
  }

  private setupLayers(): void {
    this.$nextTick(() => {
      const { nativeLayers, options } = this;
      const { width, height } = this.$el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      for (let layerId = 0; layerId < nativeLayers.length; layerId += 1) {
        const layerCanvas: HTMLCanvasElement = nativeLayers[layerId];
        layerCanvas.style.width = `${width}px`;
        layerCanvas.style.height = `${height}px`;

        const context = layerCanvas.getContext('2d');
        if (context === null) {
          throw new Error('context === null');
        }

        options.layers[layerId].setContext({
          native: context,
          width,
          height,
          dpr,
        });
      }

      this.$emit('resize', { width, height });
    })
  }
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
