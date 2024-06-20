import Layer from '@/components/layered-canvas/model/Layer';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import TimeLabelsInvalidator from '@/model/chart/axis/label/TimeLabelsInvalidator';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import { computed, watch } from 'vue';

export default class TimeAxisLabelsLayer extends Layer {
  private readonly timeAxis: TimeAxis;
  private readonly labelsInvalidator: TimeLabelsInvalidator;

  constructor(timeAxis: TimeAxis) {
    super();

    this.timeAxis = timeAxis;
    this.labelsInvalidator = new TimeLabelsInvalidator(timeAxis);

    this.addContextChangeListener((newCtx: LayerContext) => {
      this.labelsInvalidator.context = newCtx;
    });

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
