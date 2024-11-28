import { computed, watch } from 'vue';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';
import { WorkerRenderLayer } from '@/components/layered-canvas/model/WorkerRenderLayer';
import type { PriceLabelsRenderMessage } from '@/model/chart/axis/layers/workers/PriceAxisLabelsRenderWorker';

export const PRICE_LABEL_PADDING = 8;

export class PriceAxisLabelsLayer extends WorkerRenderLayer {
  private readonly priceAxis: PriceAxis;
  private readonly labelsInvalidator: PriceLabelsInvalidator;

  constructor(priceAxis: PriceAxis) {
    super(new Worker(new URL('./workers/PriceAxisLabelsRenderWorker.ts', import.meta.url), { type: 'module' }));

    this.priceAxis = priceAxis;
    this.labelsInvalidator = new PriceLabelsInvalidator(priceAxis);

    this.addContextChangeListener((newCtx: LayerContext) => {
      this.labelsInvalidator.context = newCtx;
    });

    watch([
      this.priceAxis.labels,
      this.priceAxis.inverted,
      computed(() => this.priceAxis.screenSize.second),
    ], () => {
      this.invalid = true;
    });
  }

  protected doRender(): void {
    const { height, width, dpr } = this.context;

    const inverted: InvertedValue = this.priceAxis.inverted.value;
    const { labels: { value: priceLabels }, textStyle } = this.priceAxis;
    const labelFont = makeFont(textStyle);

    this.worker.postMessage({
      type: 'RENDER',
      payload: {
        width,
        height,
        dpr,
        inverted,
        labels: priceLabels,
        labelColor: textStyle.color,
        labelFont,
        xPos: width - PRICE_LABEL_PADDING,
      },
    } as PriceLabelsRenderMessage);
  }
}
