<template>
  <div class="priceline pane" :style="cssVars">
    <layered-canvas :options="canvasOptions"  @drag-move="drag" @zoom="zoom" @resize="resize"/>
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

  private drag(e: DragMoveEvent): void {
    this.viewportModel.priceAxis.zoom(this.$el.getBoundingClientRect().height / 2, -e.dy);
  }

  private zoom(e: ZoomEvent): void {
    this.viewportModel.priceAxis.zoom(e.pivot, e.delta);
  }

  private resize(e: ResizeEvent): void {
    Object.assign(this.viewportModel.priceAxis.screenSize, {
      main: e.height, second: e.width,
    });
  }

  get cssVars(): any {
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
