<template>
  <div class="priceline pane" :style="cssVars">
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
import { InjectReactive, Prop } from 'vue-property-decorator';
import { BoxLayout, Divider } from '@/components/layout';
import LayeredCanvas, {
  DragMoveEvent,
  ResizeEvent,
  ZoomEvent,
} from '@/components/layered-canvas/LayeredCanvas.vue';
import LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import { PropType } from 'vue';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import ChartState from '@/model/ChartState';
import PriceLabelsInvalidator from '@/model/axis/label/PriceLabelsInvalidator';
import Viewport from '@/model/viewport/Viewport';
import { ChartStyle } from '@/model/ChartStyle';
import PriceAxisMarksLayer from '@/components/chart/layers/PriceAxisMarksLayer';
import PriceAxisLabelsLayer from '@/components/chart/layers/PriceAxisLabelsLayer';
import UpdateAxisRange from '@/model/axis/incidents/UpdateAxisRange';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import TVAProtocol from '@/model/history/TVAProtocol';

@Options({
  components: { LayeredCanvas, Divider, BoxLayout },
})
export default class PriceAxisWidget extends Vue {
  @Prop({ type: Object as PropType<Viewport>, required: true })
  private viewportModel!: Viewport;
  @InjectReactive()
  private chartStyle!: ChartStyle;
  @InjectReactive()
  private chartState!: ChartState;
  private canvasOptions: LayeredCanvasOptions = { layers: [] };
  private labelsInvalidator!: PriceLabelsInvalidator;
  private marksLayer!: PriceAxisMarksLayer;

  @InjectReactive()
  private tva!: TimeVarianceAuthority;

  created(): void {
    const { priceAxis } = this.viewportModel;
    this.labelsInvalidator = new PriceLabelsInvalidator(priceAxis);
    this.marksLayer = this.createMarksLayer();

    this.canvasOptions.layers.push(
      this.createLabelsLayer(),
      this.marksLayer,
      // priceline mark renderer
      // tool/cross hair label renderer
    );
  }

  mounted(): void {
    this.marksLayer.installListeners();
  }

  unmounted(): void {
    this.marksLayer.uninstallListeners();
  }

  private createLabelsLayer(): PriceAxisLabelsLayer {
    const { priceAxis } = this.viewportModel;
    const result: PriceAxisLabelsLayer = new PriceAxisLabelsLayer(priceAxis);

    result.addContextChangeListener((newCtx: LayerContext) => {
      this.labelsInvalidator.context = newCtx;
    });

    return result;
  }

  private createMarksLayer(): PriceAxisMarksLayer {
    return new PriceAxisMarksLayer(this.viewportModel);
  }

  private onDragStart(): void {
    const axis = this.viewportModel.priceAxis;

    this.tva
      .getProtocol({ incident: 'drag-in-price-axis' })
      .addIncident(new UpdateAxisRange({
        axis,
        range: { ...axis.range },
      }), false);
  }

  private onDrag(e: DragMoveEvent): void {
    const axis = this.viewportModel.priceAxis;
    axis.zoom(this.$el.getBoundingClientRect().height / 2, -e.dy);

    this.tva
      .getProtocol({ incident: 'drag-in-price-axis' })
      .addIncident(new UpdateAxisRange({
        axis,
        range: { ...axis.range },
      }), false);
  }

  private onDragEnd(): void {
    this.tva
      .getProtocol({ incident: 'drag-in-price-axis' })
      .trySign();
  }

  private zoom(e: ZoomEvent): void {
    const protocol: TVAProtocol = this.tva.getProtocol({ incident: 'zoom-price-axis', timeout: 1000 });
    const { priceAxis: axis } = this.viewportModel;

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
    this.viewportModel.priceAxis.update({ screenSize: { main: e.height, second: e.width } });
  }

  get cssVars(): unknown {
    const widgetWidth = this.chartState.priceWidgetWidth;

    return {
      '--widgetWidth': `${(widgetWidth)}px`,
    };
  }
}
</script>

<style scoped>
.priceline {
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  width: var(--widgetWidth);
  max-width: var(--widgetWidth);
  min-width: var(--widgetWidth);
  cursor: n-resize;
}
</style>
