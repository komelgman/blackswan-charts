import { watch } from 'vue';
import Layer, { type LayerRenderingContext } from '@/components/layered-canvas/model/Layer';
import { drawHorizontalLine, drawVerticalLine } from '@/misc/line-functions';
import type { PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

export default class ViewportGridLayer extends Layer {
  private readonly priceAxis: PriceAxis;
  private readonly timeAxis: TimeAxis;

  constructor(timeAxis: TimeAxis, priceAxis: PriceAxis) {
    super();

    this.priceAxis = priceAxis;
    this.timeAxis = timeAxis;

    watch([
      this.timeAxis.labels,
      this.priceAxis.labels,
      this.priceAxis.inverted,
    ], () => {
      this.invalid = true;
    });
  }

  protected render(renderingContext: LayerRenderingContext, width: number, height: number): void {
    const inverted: InvertedValue = this.priceAxis.inverted.value;
    if (inverted < 0) {
      renderingContext.translate(0, height);
    }

    renderingContext.lineWidth = 1;
    renderingContext.strokeStyle = '#1f212f'; // todo: options
    renderingContext.beginPath();

    const { labels: { value: priceLabels } } = this.priceAxis;
    for (const y of priceLabels.keys()) {
      drawHorizontalLine(renderingContext, inverted * y, 0, width);
    }

    const { labels: { value: timeLabels } } = this.timeAxis;
    for (const x of timeLabels.keys()) {
      drawVerticalLine(renderingContext, x, 0, inverted * height);
    }

    renderingContext.scale(1, 1);
    renderingContext.stroke();
  }
}
