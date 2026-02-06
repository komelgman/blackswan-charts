import { computed, watch, type WatchStopHandle } from 'vue';
import type { LayerContext } from '@blackswan/layered-canvas/model';
import { makeFont } from '@/model/misc/function.makeFont';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import { WorkerRenderLayer } from '@blackswan/layered-canvas/model';
import type { RenderPriceLabelsMessage } from '@/model/chart/axis/layers/workers/PriceAxisLabelsRenderWorker';

export const PRICE_LABEL_PADDING = 8;

export class PriceAxisLabelsLayer extends WorkerRenderLayer {
  private readonly priceAxis: PriceAxis;
  private readonly labelsInvalidator: PriceLabelsInvalidator;

  constructor(priceAxis: PriceAxis) {
    super(new Worker(new URL('./workers/PriceAxisLabelsRenderWorker.ts', import.meta.url), { type: 'module' }));

    this.priceAxis = priceAxis;
    this.labelsInvalidator = new PriceLabelsInvalidator(priceAxis);
  }

  public updateContext(ctx: LayerContext): void {
    this.labelsInvalidator.context = ctx;
    super.updateContext(ctx);
  }

  protected installWatcher(): WatchStopHandle {
    return watch([
      this.priceAxis.labels,
      this.priceAxis.inverted,
      computed(() => this.priceAxis.screenSize.second),
    ], () => {
      this.invalid = true;
    });
  }

  protected doRender(): void {
    const { height, width, dpr } = this.context;

    const { labels: { value: priceLabels }, textStyle } = this.priceAxis;
    const labelFont = makeFont(textStyle);

    this.worker.postMessage({
      type: 'RENDER',
      payload: {
        width,
        height,
        dpr,
        labels: priceLabels,
        labelColor: textStyle.color,
        labelFont,
        xPos: width - PRICE_LABEL_PADDING,
      },
    } as RenderPriceLabelsMessage);
  }
}
