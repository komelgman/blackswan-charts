import { computed, watch } from 'vue';
import Layer from '@/components/layered-canvas/model/Layer';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import type { PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';

export const PRICE_LABEL_PADDING = 8;

export default class PriceAxisLabelsLayer extends Layer {
  private readonly priceAxis: PriceAxis;
  private readonly labelsInvalidator: PriceLabelsInvalidator;

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
  }

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const inverted: InvertedValue = this.priceAxis.inverted.value;
    if (inverted < 0) {
      native.translate(0, height);
    }

    const { labels, textStyle } = this.priceAxis;

    native.textBaseline = 'middle';
    native.textAlign = 'end';
    native.fillStyle = textStyle.color;
    native.font = makeFont(textStyle);

    const x = width - PRICE_LABEL_PADDING;
    for (const [y, label] of labels) {
      native.fillText(label, x, inverted * y);
    }
  }
}
