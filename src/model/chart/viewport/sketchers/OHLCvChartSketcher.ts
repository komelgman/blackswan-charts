import { toRaw } from 'vue';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import AbstractSketcher from '@/model/chart/viewport/sketchers/AbstractSketcher';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, Drawing } from '@/model/datasource/types';
import { type OHLCv, type OHLCvChart, type UTCTimestamp, type Range, barToTime, timeToBar, type OHCLvBar } from '@/model/chart/types';
import type { ChartRenderer } from '@/model/chart/viewport/sketchers/renderers';

export default class OHLCvChartSketcher extends AbstractSketcher<OHLCvChart<any>> {
  private readonly renderer: ChartRenderer;

  public constructor(renderer: ChartRenderer) {
    super();
    this.renderer = renderer;
  }

  public invalidate(entry: DataSourceEntry<OHLCvChart<any>>, viewport: Viewport): boolean {
    const { timeAxis, dataSource } = viewport;

    const ohlc = entry.descriptor.options.data.content;
    if (!ohlc || this.needUpdateData(ohlc, timeAxis)) {
      dataSource.requestDataUpdate(entry);
    }

    return super.invalidate(entry, viewport);
  }

  private needUpdateData(ohlc: OHLCv, timeAxis: TimeAxis): boolean {
    const timeRangeFrom = timeAxis.range.from;
    const timeRangeTo = timeAxis.range.to;
    let result = false;

    if (timeRangeFrom < ohlc.loaded.from && ohlc.loaded.from > ohlc.available.from) {
      // todo: set requested range to entry
      console.log({ timeRangeFrom, lf: ohlc.loaded.from, af: ohlc.available.from });
      result = true;
    }

    if (timeRangeTo > ohlc.loaded.to && ohlc.loaded.to < ohlc.available.to) {
      // todo: set requested range to entry
      result = true;
    }

    return result;
  }

  protected draw(entry: DataSourceEntry<OHLCvChart<any>>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const ohlc = toRaw(entry.descriptor?.options.data).content;
    if (!ohlc) {
      return;
    }

    const { descriptor } = entry;
    const bars: OHCLvBar[] = this.visibleBars(ohlc, viewport.timeAxis.range);

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

    this.renderer.renderBarsToEntry(bars, entry, viewport);
  }

  private visibleBars(ohlc: OHLCv, timeRange: Readonly<Range<UTCTimestamp>>): OHCLvBar[] {
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
    const result: OHCLvBar[] = new Array(lastIndex - firstIndex + 1);

    for (let i = firstIndex; i <= lastIndex; ++i) {
      result[i - firstIndex] = [barToTime(ohlcFrom, i, ohlcStep) as UTCTimestamp, ...ohlcValues[i]];
    }

    return result;
  }
}
