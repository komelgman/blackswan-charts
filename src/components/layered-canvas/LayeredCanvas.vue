<template>
  <div
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

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop, Ref } from 'vue-property-decorator';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import { PropType } from 'vue';
import ResizeObserver from 'resize-observer-polyfill';
import Layer from '@/components/layered-canvas/layers/Layer';
import { EventRemover, onceDocument, onDocument } from '@/misc/document-listeners';
import { Point } from '@/model/type-defs';

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

@Options({})
export default class LayeredCanvas extends Vue {
  @Prop({ type: Object as PropType<LayeredCanvasOptions>, required: true })
  private options!: LayeredCanvasOptions;

  @Ref('nativeLayers')
  private nativeLayers!: HTMLCanvasElement[];

  private resizeObserver!: ResizeObserver;
  private prevPos!: Point;
  private removeMoveListener!: EventRemover;
  private removeEndListener!: EventRemover;
  private isSkipMovementsDetection: boolean = false;
  private isDrag: boolean = false;
  private dragInElement: Element | undefined;
  private isWasDrag: boolean = false;

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

  private getPos(e: MouseEvent, element?: Element): Point {
    const target = element || e.target;
    if (!(e instanceof MouseEvent) || !(target instanceof Element)) {
      throw new Error('Illeagl argument: e instanceof MouseEvent)');
    }

    const rect = target.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  private onMouseLeftBtnClick(e: MouseEvent): void {
    if (!e.defaultPrevented && !this.isWasDrag) {
      e.preventDefault();

      const event: MouseClickEvent = { ...this.getPos(e), isCtrl: e.ctrlKey };
      this.$emit('left-mouse-btn-click', event);
    }
  }

  private onMouseLeftBtnDoubleClick(e: MouseEvent): void {
    if (!e.defaultPrevented) {
      e.preventDefault();

      const event: MouseClickEvent = { ...this.getPos(e), isCtrl: e.ctrlKey };
      this.$emit('left-mouse-btn-double-click', event);
    }
  }

  private onWheel(e: WheelEvent): void {
    if (!(e instanceof MouseEvent) || !(e.target instanceof Element)) {
      return;
    }

    const event: ZoomEvent = { pivot: this.getPos(e), delta: e.deltaY };
    this.$emit('zoom', event);
  }

  private onDragStart(e: MouseEvent): void {
    if (!e.defaultPrevented && e.target instanceof Element) {
      this.isDrag = true;
      this.isWasDrag = false;
      this.dragInElement = e.target;
      this.prevPos = this.getPos(e);
      this.removeMoveListener = onDocument('mousemove', this.onDragMove, true);
      this.removeEndListener = onceDocument('mouseup', this.onDragEnd);
    }
  }

  private onDragMove(e: MouseEvent): void {
    if (!this.isDrag || this.isSkipMovementsDetection) {
      return;
    }
    this.isSkipMovementsDetection = true;

    if (!this.isWasDrag) {
      const startEvent: MouseClickEvent = { ...this.getPos(e, this.dragInElement), isCtrl: e.ctrlKey };
      this.$emit('drag-start', startEvent);
      this.isWasDrag = true;
    }

    const pos: Point = this.getPos(e, this.dragInElement);
    const moveEvent: DragMoveEvent = { ...pos, dx: this.prevPos.x - pos.x, dy: this.prevPos.y - pos.y };
    this.$emit('drag-move', moveEvent);
    this.prevPos = pos;

    // hint: decrease amount of drag events
    setTimeout(() => { this.isSkipMovementsDetection = false; }, 10);
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isDrag || this.isSkipMovementsDetection) {
      return;
    }
    this.isSkipMovementsDetection = true;

    const event: MousePositionEvent = this.getPos(e);
    this.$emit('mouse-move', event);

    // hint: decrease amount of move events
    setTimeout(() => { this.isSkipMovementsDetection = false; }, 10);
  }

  private onDragEnd(e?: DragEvent): void {
    this.isDrag = false;

    if (e === undefined || !e.defaultPrevented) {
      if (e !== undefined && this.isWasDrag) {
        e.preventDefault();
        const event: MousePositionEvent = this.getPos(e, this.dragInElement);
        this.$emit('drag-end', event);
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
        if (!context) {
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
