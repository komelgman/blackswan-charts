import { computed, watch } from 'vue';
import Layer from '@/components/layered-canvas/model/Layer';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';

export const PRICE_LABEL_PADDING = 8;

export class PriceAxisLabelsLayer extends Layer {
  private readonly priceAxis: PriceAxis;
  private readonly labelsInvalidator: PriceLabelsInvalidator;
  private readonly worker: Worker;
  private wasInit: boolean = false;

  constructor(priceAxis: PriceAxis) {
    super();

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

    this.worker = new Worker(new URL('./workers/PriceAxisLabelsRenderWorker.ts', import.meta.url), { type: 'module' });
  }

  public setContext(ctx: LayerContext): void {
    if (!this.wasInit) {
      this.wasInit = true;
      const canvas = ctx.mainCanvas.transferControlToOffscreen();
      this.worker.postMessage({ canvas }, [canvas]);
    }

    super.setContext(ctx);
  }

  protected render(onComplete: Function): void {
    this.worker.onmessage = (e) => {
      if (e.data.type === 'RENDER_COMPLETE') {
        onComplete();
      }
    };

    const { height, width, dpr } = this.context;

    const inverted: InvertedValue = this.priceAxis.inverted.value;
    const { labels: { value: priceLabels }, textStyle } = this.priceAxis;
    const labelFont = makeFont(textStyle);
    const labelsArray = Array.from(priceLabels.entries());

    this.worker.postMessage({
      width,
      height,
      dpr,
      inverted,
      labels: labelsArray,
      labelColor: textStyle.color,
      labelFont,
      xPos: width - PRICE_LABEL_PADDING,
    });
  }

  public destroy() {
    this.worker.terminate();
  }
}
