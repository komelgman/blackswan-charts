<template>
  <div class="timeline pane">
    <layered-canvas
      :options="canvasOptions"
      @drag-move="onDrag"
      @zoom="zoom"
      @resize="resize"
    />
  </div>
</template>

<script lang="ts">
import TimeAxisLabelsLayer from '@/components/chart/layers/TimeAxisLabelsLayer';
import LayeredCanvas, {
  DragMoveEvent,
  ResizeEvent,
  ZoomEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import TimeLabelsInvalidator from '@/model/axis/label/TimeLabelsInvalidator';
import TimeAxis from '@/model/axis/TimeAxis';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import { PropType } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { InjectReactive, Prop } from 'vue-property-decorator';

@Options({
  components: { LayeredCanvas },
})
export default class TimeAxisWidget extends Vue {
  @Prop({ type: Object as PropType<TimeAxis>, required: true })
  private timeAxis!: TimeAxis;
  private canvasOptions: LayeredCanvasOptions = { layers: [] };
  private labelsInvalidator!: TimeLabelsInvalidator;

  @InjectReactive()
  private tva!: TimeVarianceAuthority;

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

  private onDrag(e: DragMoveEvent): void {
    this.timeAxis.zoom(this.$el.getBoundingClientRect().width / 2, -e.dx);
  }

  private zoom(e: ZoomEvent): void {
    this.timeAxis.zoom(e.pivot.x, e.delta);
  }

  private resize(e: ResizeEvent): void {
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
