import { computed, watch } from 'vue';
import Layer from '@/components/layered-canvas/model/Layer';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';

export const PRICE_LABEL_PADDING = 8;

const RENDERER_WORKER = new Blob([`
let ctx;
self.onmessage = (e) => {
  const { 
    canvas, 
    width, 
    height,
    dpr,
    inverted, 
    labels, 
    labelColor,
    labelFont, 
    xPos,
  } = e.data;
    if (canvas) {
      ctx = canvas.getContext('2d');
      self.postMessage({ type: 'RENDER_INITIALIZED' });
      return;
    }

    if (!ctx) {
      self.postMessage({ type: 'RENDER_SKIPPED' });
      return;
    }

    ctx.canvas.width = Math.floor(width * dpr);
    ctx.canvas.height = Math.floor(height * dpr);

    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.save();


    if (inverted < 0) {
      ctx.translate(0, height);
    }

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'end';
    ctx.fillStyle = labelColor;
    ctx.font = labelFont;

    for (const [yPos, label] of labels) {
      ctx.fillText(label, xPos, inverted * yPos);
    }

    ctx.restore();

    self.postMessage({ type: 'RENDER_COMPLETE' });
  };
`], { type: 'application/javascript' });

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

    this.worker = new Worker(URL.createObjectURL(RENDERER_WORKER));
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
