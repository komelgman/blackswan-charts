import { watch } from 'vue';
import type { PriceAxis, InvertedValue } from '@/model/chart/axis/PriceAxis';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import { WorkerRenderLayer } from '@/components/layered-canvas/model/WorkerRenderLayer';
import type { RenderViewportGridMessage } from '@/model/chart/viewport/layers/workers/ViewportGridRenderWorker';

export default class ViewportGridLayer extends WorkerRenderLayer {
  private readonly priceAxis: PriceAxis;
  private readonly timeAxis: TimeAxis;

  constructor(timeAxis: TimeAxis, priceAxis: PriceAxis) {
    super(new Worker(new URL('./workers/ViewportGridRenderWorker.ts', import.meta.url), { type: 'module' }));

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

  protected doRender(): void {
    const { height, width, dpr } = this.context;
    const inverted: InvertedValue = this.priceAxis.inverted.value;
    const { labels: { value: timeLabels } } = this.timeAxis;
    const { labels: { value: priceLabels } } = this.priceAxis;

    this.worker.postMessage({
      type: 'RENDER',
      payload: {
        width,
        height,
        dpr,
        inverted,
        timeLabels,
        priceLabels,
        color: '#1f212f', // todo: options
      },
    } as RenderViewportGridMessage);
  }
}
