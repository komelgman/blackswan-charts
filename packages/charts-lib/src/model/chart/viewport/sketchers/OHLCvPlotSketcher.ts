import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry, Drawing } from '@/model/datasource/types';
import type { OHLCv, OHLCvPlot, UTCTimestamp, Range, OHLCvBar, OHLCvPlotOptions, Price } from '@/model/chart/types';
import { OHLCV_RECORD_CLOSE, OHLCV_RECORD_HIGH, OHLCV_RECORD_LOW, OHLCV_RECORD_OPEN, OHLCV_RECORD_VOLUME } from '@/model/chart/types';
import type { TimePeriod } from '@/model/chart/types/time';
import { TIME_PERIODS_MAP } from '@/model/chart/types/time';
import { AbstractSketcher } from '@/model/chart/viewport/sketchers';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import { ControlMode } from '@/model/chart/axis/types';

export class OHLCvPlotSketcher<O extends OHLCvPlotOptions> extends AbstractSketcher<OHLCvPlot<O>> {
  private readonly renderer: OHLCvPlotRenderer<O>;

  public constructor(renderer: OHLCvPlotRenderer<O>) {
    super();
    this.renderer = renderer;
  }

  protected draw(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: DrawingProjection): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const ohlc = entry.descriptor?.options.data.content;
    if (!ohlc) {
      return;
    }

    const timePeriod = TIME_PERIODS_MAP.get(ohlc.step);
    if (!timePeriod) {
      console.error(`Illegal time period was found "${ohlc.step}"`);
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

    this.updatePrefferedRanges(ohlc, timePeriod, entry, viewport);

    const { descriptor } = entry;
    const bars: OHLCvBar[] = this.visibleBars(ohlc, timePeriod, viewport.timeAxis.range);

    descriptor.visibleInViewport = bars.length > 0;
    descriptor.valid = true;

    if (!descriptor.visibleInViewport) {
      return;
    }

    this.renderBarsToEntry(bars, entry, viewport);
  }

  protected updatePrefferedRanges(ohlc: OHLCv, timePeriod: TimePeriod, entry: DataSourceEntry<OHLCvPlot<O>>, viewport: DrawingProjection): void {
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

    const barDuration = timePeriod.averageBarDuration;
    let timeRange: Range<UTCTimestamp> | undefined;
    let priceRange: Range<Price> | undefined;

    if (timeAxis.controlMode.value !== MANUAL) {
      // todo: add preferred barWidth to chart style options and calculate bar count from prefBarWidth and timeAxis.screenSize

      const to = (ohlc.available.to + barDuration * 20) as UTCTimestamp;
      const from = timeAxis.isJustFollow()
        ? (to - (timeAxis.range.to - timeAxis.range.from)) as UTCTimestamp
        : (to - barDuration * 300) as UTCTimestamp;

      timeRange = { from, to };
    }

    if (priceAxis.controlMode.value !== MANUAL) {
      const tmp = timeRange || timeAxis.range;
      const { loaded, values: ohlcValues } = ohlc;

      if (loaded.from < tmp.to && timePeriod.barToTime(loaded.from, ohlcValues.length) >= tmp.from) {
        const [firstIndex, lastIndex] = this.rangeToBarIndexes(ohlc, timePeriod, tmp);

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

  protected renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<OHLCvPlot<O>>, viewport: DrawingProjection): void {
    this.renderer.renderBarsToEntry(bars, entry, viewport);
  }

  protected visibleBars(ohlc: OHLCv, timePeriod: TimePeriod, timeRange: Readonly<Range<UTCTimestamp>>): OHLCvBar[] {
    const { loaded, values: ohlcValues } = ohlc;
    const { from: ohlcFrom } = loaded;
    const [firstIndex, lastIndex] = this.rangeToBarIndexes(ohlc, timePeriod, timeRange);
    const result: OHLCvBar[] = new Array(lastIndex - firstIndex);

    for (let i = firstIndex; i <= lastIndex; ++i) {
      const record = ohlcValues[i];
      result[i - firstIndex] = [
        timePeriod.barToTime(ohlcFrom, i) as UTCTimestamp,
        record[OHLCV_RECORD_OPEN],
        record[OHLCV_RECORD_HIGH],
        record[OHLCV_RECORD_LOW],
        record[OHLCV_RECORD_CLOSE],
        record[OHLCV_RECORD_VOLUME],
      ];
    }

    return result;
  }

  protected rangeToBarIndexes(ohlc: OHLCv, timePeriod: TimePeriod, timeRange: Range<UTCTimestamp>): [firstBar: number, lastBar: number] {
    const { loaded, values: ohlcValues } = ohlc;
    const { from: ohlcFrom } = loaded;
    const barCount = ohlcValues.length - 1;

    if (ohlcFrom > timeRange.to || timePeriod.barToTime(ohlcFrom, barCount + 1) < timeRange.from) {
      return [0, 0];
    }

    const firstVisibleBar = Math.floor(timePeriod.timeToBar(ohlcFrom, timeRange.from));
    const lastVisibleBar = Math.ceil(timePeriod.timeToBar(ohlcFrom, timeRange.to));

    const firstIndex = Math.max(0, firstVisibleBar);
    const lastIndex = Math.min(barCount, lastVisibleBar);

    return [firstIndex, lastIndex];
  }
}
