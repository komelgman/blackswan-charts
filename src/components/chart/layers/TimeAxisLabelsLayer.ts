import Layer from '@/components/layered-canvas/layers/Layer';
import makeFont from '@/misc/make-font';
import TimeAxis from '@/model/axis/TimeAxis';
import { computed, watch } from 'vue';

export default class TimeAxisLabelsLayer extends Layer {
  private readonly timeAxis: TimeAxis;

  constructor(timeAxis: TimeAxis) {
    super();
    this.timeAxis = timeAxis;

    watch([
      this.timeAxis.labels,
      computed(() => this.timeAxis.screenSize.second),
    ], () => {
      this.invalid = true;
    });
  }

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const { labels, textStyle } = this.timeAxis;

    native.textBaseline = 'middle';
    native.textAlign = 'center';
    native.fillStyle = textStyle.color;
    native.font = makeFont(textStyle);

    const y: number = height * 0.5;
    for (const [x, label] of labels) {
      native.fillText(label, x, y);
    }
  }
}
