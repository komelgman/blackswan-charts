import Layer from '@/components/layered-canvas/layers/Layer';
import makeFont from '@/misc/make-font';
import type PriceAxis from '@/model/axis/PriceAxis';
import type { InvertedValue } from '@/model/axis/PriceAxis';
import { computed, watch } from 'vue';

export const PRICE_LABEL_PADDING = 8;

export default class PriceAxisLabelsLayer extends Layer {
  private readonly priceAxis: PriceAxis;

  constructor(priceAxis: PriceAxis) {
    super();
    this.priceAxis = priceAxis;

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
