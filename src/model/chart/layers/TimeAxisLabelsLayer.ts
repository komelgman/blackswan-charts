import { computed, watch } from 'vue';
import Layer, { type LayerRenderingContext } from '@/components/layered-canvas/model/Layer';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import TimeLabelsInvalidator from '@/model/chart/axis/label/TimeLabelsInvalidator';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

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

  protected render(renderingContext: LayerRenderingContext, width: number, height: number): void {
    const { labels: { value: timeLabels }, textStyle } = this.timeAxis;

    renderingContext.textBaseline = 'middle';
    renderingContext.textAlign = 'center';
    renderingContext.fillStyle = textStyle.color;
    renderingContext.font = makeFont(textStyle);

    const y: number = height * 0.5;
    for (const [x, label] of timeLabels) {
      renderingContext.fillText(label, x, y);
    }
  }
}
