import { toRaw } from 'vue';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, Drawing } from '@/model/datasource/types';
import type { OHLCv, OHLCvPlot, UTCTimestamp, Range, OHLCvBar, OHLCvPlotOptions } from '@/model/chart/types';
import { barToTime, timeToBar } from '@/model/chart/types';
import { AbstractSketcher } from '@/model/chart/viewport/sketchers';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';

export class OHLCvPlotSketcher<O extends OHLCvPlotOptions> extends AbstractSketcher<OHLCvPlot<O>> {
  private readonly renderer: OHLCvPlotRenderer<O>;

  public constructor(renderer: OHLCvPlotRenderer<O>) {
    super();
    this.renderer = renderer;
  }

  public invalidate(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): boolean {
    this.invalidateOHLCvContentOptions(entry, viewport);

    return super.invalidate(entry, viewport);
  }

  invalidateOHLCvContentOptions(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport) {
    const { dataSource, timeAxis } = viewport;
    const ohlc = entry.descriptor.options.data.content;
    if (!ohlc || this.needUpdateData(ohlc, timeAxis)) {
      dataSource.noHistoryManagedEntriesProcess([entry.descriptor.ref], () => {});
    }
  }

  private needUpdateData(ohlc: OHLCv, timeAxis: TimeAxis): boolean {
    const timeRangeFrom = timeAxis.range.from;
    const timeRangeTo = timeAxis.range.to;
    let result = false;

    if (timeRangeFrom < ohlc.loaded.from && ohlc.loaded.from > ohlc.available.from) {
      // todo: set requested range to entry
      result = true;
    }

    if (timeRangeTo > ohlc.loaded.to && ohlc.loaded.to < ohlc.available.to) {
      // todo: set requested range to entry
      result = true;
    }

    return result;
  }

  protected draw(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const ohlc = toRaw(entry.descriptor?.options.data).content;
    if (!ohlc) {
      return;
    }

    const { descriptor } = entry;
    const bars: OHLCvBar[] = this.visibleBars(ohlc, viewport.timeAxis.range);

    descriptor.visibleInViewport = bars.length > 0;
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    const { drawing } = entry;
    if (drawing === undefined || drawing.renderer !== this.renderer.name) {
      entry.drawing = {
        parts: [],
        handles: {},
        renderer: this.renderer.name,
      } as Drawing;
    }

    this.renderBarsToEntry(bars, entry, viewport);
  }

  protected renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    this.renderer.renderBarsToEntry(bars, entry, viewport);
  }

  private visibleBars(ohlc: OHLCv, timeRange: Readonly<Range<UTCTimestamp>>): OHLCvBar[] {
    const { loaded, step: ohlcStep, values: ohlcValues } = ohlc;
    const { from: ohlcFrom } = loaded;
    const barCount = ohlcValues.length;

    if (ohlcFrom > timeRange.to || barToTime(ohlcFrom, barCount, ohlcStep) < timeRange.from) {
      return [];
    }

    const firstVisibleBar = Math.floor(timeToBar(ohlcFrom, timeRange.from, ohlcStep));
    const lastVisibleBar = Math.ceil(timeToBar(ohlcFrom, timeRange.to, ohlcStep));

    const firstIndex = Math.max(0, firstVisibleBar);
    const lastIndex = Math.min(barCount - 1, lastVisibleBar);
    const result: OHLCvBar[] = new Array(lastIndex - firstIndex + 1);

    for (let i = firstIndex; i <= lastIndex; ++i) {
      result[i - firstIndex] = [barToTime(ohlcFrom, i, ohlcStep) as UTCTimestamp, ...ohlcValues[i]];
    }

    return result;
  }
}
