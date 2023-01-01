<template>
  <div class="timeline pane">
    <layered-canvas
      :options="canvasOptions"
      @drag-move="onDrag"
      @zoom="onZoom"
      @resize="onResize"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import TimeAxisLabelsLayer from '@/components/chart/layers/TimeAxisLabelsLayer';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { DragMoveEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import type LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import TimeLabelsInvalidator from '@/model/axis/label/TimeLabelsInvalidator';
import type TimeAxis from '@/model/axis/TimeAxis';

@Options({
  components: { LayeredCanvas },
})
export default class TimeAxisWidget extends Vue {
  canvasOptions: LayeredCanvasOptions = { layers: [] };
  @Prop({ type: Object as PropType<TimeAxis>, required: true })
  private timeAxis!: TimeAxis;
  private labelsInvalidator!: TimeLabelsInvalidator;

  created(): void {
    this.labelsInvalidator = new TimeLabelsInvalidator(this.timeAxis);

    this.canvasOptions.layers.push(
      this.createLabelsLayer(),
      // marks renderer
      // priceline label renderer
      // tool/crosshair label renderer
    );
  }

  private createLabelsLayer(): TimeAxisLabelsLayer {
    const { timeAxis } = this;
    const result: TimeAxisLabelsLayer = new TimeAxisLabelsLayer(timeAxis);

    result.addContextChangeListener((newCtx: LayerContext) => {
      this.labelsInvalidator.context = newCtx;
    });

    return result;
  }

  onDrag(e: DragMoveEvent): void {
    this.timeAxis.zoom(this.$el.getBoundingClientRect().width / 2, -e.dx);
  }

  onZoom(e: ZoomEvent): void {
    this.timeAxis.zoom(e.pivot.x, e.delta);
  }

  onResize(e: ResizeEvent): void {
    this.timeAxis.update({ screenSize: { main: e.width, second: e.height } });
  }
}
</script>

<style scoped>
.timeline {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  cursor: w-resize;
}
</style>
