<template>
  <div class="timeline pane">
    <layered-canvas
      :options="canvasOptions"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @drag-move="onDrag"
      @zoom="zoom"
      @resize="resize"
    />
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
import { InjectReactive, Prop } from 'vue-property-decorator';
import { PropType } from 'vue';
import TimeAxis from '@/model/axis/TimeAxis';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import TimeLabelsInvalidator from '@/model/axis/label/TimeLabelsInvalidator';
import TimeAxisLabelsLayer from '@/components/chart/layers/TimeAxisLabelsLayer';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import UpdateAxisRange from '@/model/axis/incidents/UpdateAxisRange';
import TVAProtocol from '@/model/history/TVAProtocol';

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

  private onDragStart(): void {
    const axis = this.timeAxis;
    this.tva
      .getProtocol({ incident: 'drag-in-time-axis' })
      .addIncident(new UpdateAxisRange({
        axis,
        range: { ...axis.range },
      }), false);
  }

  private onDrag(e: DragMoveEvent): void {
    const axis = this.timeAxis;
    axis.zoom(this.$el.getBoundingClientRect().width / 2, -e.dx);

    this.tva
      .getProtocol({ incident: 'drag-in-time-axis' })
      .addIncident(new UpdateAxisRange({
        axis,
        range: { ...axis.range },
      }), false);
  }

  private onDragEnd(): void {
    this.tva
      .getProtocol({ incident: 'drag-in-time-axis' })
      .trySign();
  }

  private zoom(e: ZoomEvent): void {
    const protocol: TVAProtocol = this.tva.getProtocol({ incident: 'zoom-time-axis', timeout: 1000 });
    const { timeAxis: axis } = this;

    if (protocol.isEmpty) {
      // setup initial value
      protocol.addIncident(new UpdateAxisRange({
        axis,
        range: { ...axis.range },
      }));
    }

    axis.zoom(e.pivot, e.delta);

    protocol.addIncident(new UpdateAxisRange({
      axis,
      range: { ...axis.range },
    }));
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
