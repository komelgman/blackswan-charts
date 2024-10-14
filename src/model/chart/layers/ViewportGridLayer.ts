import { watch } from 'vue';
import Layer from '@/components/layered-canvas/model/Layer';
import { drawHorizontalLine, drawVerticalLine } from '@/misc/line-functions';
import type { default as PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';
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

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const inverted: InvertedValue = this.priceAxis.inverted.value;
    if (inverted < 0) {
      native.translate(0, height);
    }

    native.lineWidth = 1;
    native.strokeStyle = '#1f212f'; // todo
    native.beginPath();

    const { labels: priceLabels } = this.priceAxis;
    for (const y of priceLabels.keys()) {
      drawHorizontalLine(native, inverted * y, 0, width);
    }

    const { labels: timeLabels } = this.timeAxis;
    for (const x of timeLabels.keys()) {
      drawVerticalLine(native, x, 0, inverted * height);
    }

    native.scale(1, 1);
    native.stroke();
  }
}
