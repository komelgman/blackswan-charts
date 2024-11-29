import { computed, watch, type WatchStopHandle } from 'vue';
import type { LayerContext } from '@/components/layered-canvas/types';
import makeFont from '@/misc/make-font';
import TimeLabelsInvalidator from '@/model/chart/axis/label/TimeLabelsInvalidator';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import { WorkerRenderLayer } from '@/components/layered-canvas/model/WorkerRenderLayer';
import type { RenderTimeLabelsMessage } from '@/model/chart/axis/layers/workers/TimeAxisLabelsRenderWorker';

export class TimeAxisLabelsLayer extends WorkerRenderLayer {
  private readonly timeAxis: TimeAxis;
  private readonly labelsInvalidator: TimeLabelsInvalidator;

  constructor(timeAxis: TimeAxis) {
    super(new Worker(new URL('./workers/TimeAxisLabelsRenderWorker.ts', import.meta.url), { type: 'module' }));

    this.timeAxis = timeAxis;
    this.labelsInvalidator = new TimeLabelsInvalidator(timeAxis);
  }

  public updateContext(ctx: LayerContext): void {
    this.labelsInvalidator.context = ctx;
    super.updateContext(ctx);
  }

  protected installWatcher(): WatchStopHandle {
    return watch([
      this.timeAxis.labels,
      computed(() => this.timeAxis.screenSize.second),
    ], () => {
      this.invalid = true;
    });
  }

  protected doRender(): void {
    const { height, width, dpr } = this.context;

    const { labels: { value: timeLabels }, textStyle } = this.timeAxis;
    const labelFont = makeFont(textStyle);

    this.worker.postMessage({
      type: 'RENDER',
      payload: {
        width,
        height,
        dpr,
        labels: timeLabels,
        labelColor: textStyle.color,
        labelFont,
      },
    } as RenderTimeLabelsMessage);
  }
}
