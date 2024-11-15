import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, Drawing } from '@/model/datasource/types';
import type { OHLCv, OHLCvPlot, UTCTimestamp, Range, OHLCvBar, OHLCvPlotOptions, OHLCvContentOptions, Price } from '@/model/chart/types';
import { barToTime, getBarDurationAvg, OHLCV_RECORD_HIGH, OHLCV_RECORD_LOW, timeToBar } from '@/model/chart/types';
import { AbstractSketcher } from '@/model/chart/viewport/sketchers';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import { merge } from '@/misc/object.merge';
import type { DeepPartial } from '@/model/type-defs';
import { DataSourceChangeEventReason } from '@/model/datasource/events';
import { deepEqual } from '@/misc/object.deepEqual';
import { ControlMode } from '@/model/chart/axis/types';

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

  protected invalidateOHLCvContentOptions(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    const optionsUpdate = this.getContentOptionsUpdate(entry, viewport);
    const { dataSource } = viewport;

    if (!deepEqual(optionsUpdate, {})) {
      dataSource.noHistoryManagedEntriesProcess(
        [entry.descriptor.ref],
        (e: DataSourceEntry<OHLCvPlot<any>>) => {
          const contentOptions = e.descriptor.options.data?.contentOptions;
          if (contentOptions) {
            merge(contentOptions, optionsUpdate);
          }
        },
        DataSourceChangeEventReason.DataInvalid,
      );
    }
  }

  protected getContentOptionsUpdate(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): DeepPartial<OHLCvContentOptions> {
    const { timeAxis } = viewport;
    const { content: ohlc, contentOptions: options } = entry.descriptor.options.data;

    if (!ohlc || !options) {
      return {};
    }

    const timeRangeFrom = timeAxis.range.from;
    const timeRangeTo = timeAxis.range.to;
    const result = {};
    if (timeRangeFrom < ohlc.loaded.from && ohlc.loaded.from > ohlc.available.from) {
      // todo: set requested range to entry
    }

    if (timeRangeTo > ohlc.loaded.to && ohlc.loaded.to < ohlc.available.to) {
      // todo: set requested range to entry
    }

    return result;
  }

  protected draw(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const ohlc = entry.descriptor?.options.data.content;
    if (!ohlc) {
      return;
    }

    const { drawing } = entry;
    if (drawing === undefined || drawing.renderer !== this.renderer.name) {
      entry.drawing = {
        parts: [],
        handles: {},
        renderer: this.renderer.name,
        preferred: drawing?.preferred,
      } as Drawing;
    }

    this.updatePrefferedRanges(ohlc, entry, viewport);

    const { descriptor } = entry;
    const bars: OHLCvBar[] = this.visibleBars(ohlc, viewport.timeAxis.range);

    descriptor.visibleInViewport = bars.length > 0;
    descriptor.valid = true;

    if (!descriptor.visibleInViewport) {
      return;
    }

    this.renderBarsToEntry(bars, entry, viewport);
  }

  protected updatePrefferedRanges(ohlc: OHLCv, entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    const { drawing } = entry;
    if (!drawing) {
      throw new Error('IllegalState: drawing should be initalised');
    }

    const { priceAxis, timeAxis } = viewport;
    const { MANUAL } = ControlMode;
    if (timeAxis.controlMode.value === MANUAL && priceAxis.controlMode.value === MANUAL) {
      drawing.preferred = undefined;
      return;
    }

    const barDuration = getBarDurationAvg(ohlc.step);
    let timeRange: Range<UTCTimestamp> | undefined;
    let priceRange: Range<Price> | undefined;

    if (timeAxis.controlMode.value !== MANUAL) {
      // todo: add preferred barWidth to chart style options and calculate bar count from prefBarWidth and timeAxis.screenSize
      timeRange = { from: (ohlc.available.to - barDuration * 280) as UTCTimestamp, to: (ohlc.available.to + barDuration * 20) as UTCTimestamp };
    }

    if (priceAxis.controlMode.value !== MANUAL) {
      const tmp = timeRange || timeAxis.range;
      const { loaded, step: ohlcStep, values: ohlcValues } = ohlc;

      if (loaded.from < tmp.to && barToTime(loaded.from, ohlcValues.length, ohlcStep) >= tmp.from) {
        const [firstIndex, lastIndex] = this.rangeToBarIndexes(ohlc, tmp);

        if (firstIndex !== lastIndex) {
          let low = Number.MAX_VALUE;
          let high = -Number.MAX_VALUE;

          for (let i = firstIndex; i <= lastIndex; ++i) {
            low = Math.min(ohlcValues[i][OHLCV_RECORD_LOW], low);
            high = Math.max(ohlcValues[i][OHLCV_RECORD_HIGH], high);
          }

          // todo: to config or style
          const lowPad = 0.15;
          const highPad = 0.1;

          priceRange = priceAxis.applyPaddingToRange({ from: low as Price, to: high as Price }, -lowPad, highPad);
        }
      }
    }

    drawing.preferred = { timeAxis: timeRange, priceAxis: priceRange };
  }

  protected renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    this.renderer.renderBarsToEntry(bars, entry, viewport);
  }

  protected visibleBars(ohlc: OHLCv, timeRange: Readonly<Range<UTCTimestamp>>): OHLCvBar[] {
    const { loaded, step: ohlcStep, values: ohlcValues } = ohlc;
    const { from: ohlcFrom } = loaded;
    const [firstIndex, lastIndex] = this.rangeToBarIndexes(ohlc, timeRange);
    const result: OHLCvBar[] = new Array(lastIndex - firstIndex);

    for (let i = firstIndex; i <= lastIndex; ++i) {
      result[i - firstIndex] = [barToTime(ohlcFrom, i, ohlcStep) as UTCTimestamp, ...ohlcValues[i]];
    }

    return result;
  }

  protected rangeToBarIndexes(ohlc: OHLCv, timeRange: Range<UTCTimestamp>): [firstBar: number, lastBar: number] {
    const { loaded, step: ohlcStep, values: ohlcValues } = ohlc;
    const { from: ohlcFrom } = loaded;
    const barCount = ohlcValues.length - 1;

    if (ohlcFrom > timeRange.to || barToTime(ohlcFrom, barCount + 1, ohlcStep) < timeRange.from) {
      return [0, 0];
    }

    const firstVisibleBar = Math.floor(timeToBar(ohlcFrom, timeRange.from, ohlcStep));
    const lastVisibleBar = Math.ceil(timeToBar(ohlcFrom, timeRange.to, ohlcStep));

    const firstIndex = Math.max(0, firstVisibleBar);
    const lastIndex = Math.min(barCount, lastVisibleBar);

    return [firstIndex, lastIndex];
  }
}
