<template>
  <div class="priceline pane" :style="cssVars">
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
import { Inject, Prop } from 'vue-property-decorator';
import PriceAxisLabelsLayer from '@/components/chart/layers/PriceAxisLabelsLayer';
import PriceAxisMarksLayer from '@/components/chart/layers/PriceAxisMarksLayer';
import LayeredCanvas from '@/components/layered-canvas/LayeredCanvas.vue';
import type { DragMoveEvent, ResizeEvent, ZoomEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import type LayeredCanvasOptions from '@/components/layered-canvas/LayeredCanvasOptions';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import { BoxLayout, Divider } from '@/components/layout';
import PriceLabelsInvalidator from '@/model/axis/label/PriceLabelsInvalidator';
import type ChartState from '@/model/ChartState';
import type { ChartStyle } from '@/model/ChartStyle';
import type Viewport from '@/model/viewport/Viewport';

@Options({
  components: { LayeredCanvas, Divider, BoxLayout },
})
export default class PriceAxisWidget extends Vue {
  canvasOptions: LayeredCanvasOptions = { layers: [] };

  @Prop({ type: Object as PropType<Viewport>, required: true })
  private viewportModel!: Viewport;
  @Inject()
  private chartStyle!: ChartStyle;
  @Inject()
  private chartState!: ChartState;
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

  onDrag(e: DragMoveEvent): void {
    this.viewportModel.priceAxis.zoom(this.$el.getBoundingClientRect().height / 2, -e.dy);
  }

  onZoom(e: ZoomEvent): void {
    this.viewportModel.priceAxis.zoom(e.pivot.y, e.delta);
  }

  onResize(e: ResizeEvent): void {
    this.viewportModel.priceAxis.update({ screenSize: { main: e.height, second: e.width } });
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
