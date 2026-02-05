import { computed, inject, watch, type ComputedRef, type WatchStopHandle } from 'vue';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import { WorkerRenderLayer } from '@/components/layered-canvas/model/WorkerRenderLayer';
import type { RenderViewportGridMessage } from '@/model/chart/viewport/layers/workers/ViewportGridRenderWorker';
import type { ChartStyle } from '@/model/chart/types/styles';

export default class ViewportGridLayer extends WorkerRenderLayer {
  private readonly priceAxis: PriceAxis;
  private readonly timeAxis: TimeAxis;
  private readonly chartStyle: ComputedRef<ChartStyle> | undefined;

  constructor(timeAxis: TimeAxis, priceAxis: PriceAxis) {
    super(new Worker(new URL('./workers/ViewportGridRenderWorker.ts', import.meta.url), { type: 'module' }));

    this.priceAxis = priceAxis;
    this.timeAxis = timeAxis;
    this.chartStyle = inject<ComputedRef<ChartStyle>>('chartStyle');
  }

  protected installWatcher(): WatchStopHandle {
    return watch([
      this.timeAxis.labels,
      this.priceAxis.labels,
      this.priceAxis.inverted,
      computed(() => this.chartStyle?.value.viewport.gridColor),
    ], () => {
      this.invalid = true;
    });
  }

  protected doRender(): void {
    const { height, width, dpr } = this.context;
    const { labels: { value: timeLabels } } = this.timeAxis;
    const { labels: { value: priceLabels } } = this.priceAxis;

    this.worker.postMessage({
      type: 'RENDER',
      payload: {
        width,
        height,
        dpr,
        timeLabels,
        priceLabels,
        color: this.chartStyle?.value.viewport.gridColor,
      },
    } as RenderViewportGridMessage);
  }
}
