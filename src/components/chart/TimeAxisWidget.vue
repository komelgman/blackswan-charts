<template>
  <div class="timeline pane">
    <layered-canvas :options="canvasOptions" @drag-move="drag" @zoom="zoom" @resize="resize"/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import LayeredCanvas, {
  DragMoveEvent,
  ResizeEvent,
  ZoomEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';

import { Prop } from 'vue-property-decorator';
import { PropType } from 'vue';
import TimeAxis from '@/model/axis/TimeAxis';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import TimeLabelsInvalidator from '@/model/axis/label/TimeLabelsInvalidator';
import TimeAxisLabelsLayer from '@/components/chart/layers/TimeAxisLabelsLayer';

@Options({
  components: { LayeredCanvas },
})
export default class TimeAxisWidget extends Vue {
  @Prop({ type: Object as PropType<TimeAxis>, required: true })
  private timeAxis!: TimeAxis;
  private canvasOptions: LayeredCanvasOptions = { layers: [] };
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

  mounted(): void {
    // todo install listeners
  }

  unmounted(): void {
    // todo uninstall listeners
  }

  private createLabelsLayer(): TimeAxisLabelsLayer {
    const { timeAxis } = this;
    const result: TimeAxisLabelsLayer = new TimeAxisLabelsLayer(timeAxis);

    result.addContextChangeListener((newCtx: LayerContext) => {
      this.labelsInvalidator.context = newCtx;
    });

    return result;
  }

  private drag(e: DragMoveEvent): void {
    this.timeAxis.zoom(this.$el.getBoundingClientRect().width / 2, -e.dx);
  }

  private zoom(e: ZoomEvent): void {
    this.timeAxis.zoom(e.pivot, e.delta);
  }

  private resize(e: ResizeEvent): void {
    Object.assign(this.timeAxis.screenSize, {
      main: e.width, second: e.height,
    });
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
