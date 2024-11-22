import { toRaw } from 'vue';
import {
  type OHLCvPlot,
  type OHLCvBar,
  type UTCTimestamp,
  type CandleType,
  type CandleColors,
  OHLCV_BAR_TIMESTAMP,
  OHLCV_BAR_OPEN,
  OHLCV_BAR_HIGH,
  OHLCV_BAR_LOW,
  OHLCV_BAR_CLOSE,
} from '@/model/chart/types';
import { TIME_PERIODS_MAP } from '@/model/chart/types/time';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import type { CandleGraphicsOptions } from '@/model/chart/viewport/sketchers/graphics/CandleGraphics';
import CandleGraphics from '@/model/chart/viewport/sketchers/graphics/CandleGraphics';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { resizeInPlace } from '@/misc/array.resizeInPlace';
import type { HasType } from '@/model/type-defs/optional';

export declare type CandlestickPlot = OHLCvPlot<CandlestickPlotOptions>;

export interface CandlestickPlotOptions extends HasType<'CandlestickPlot'> {
  barStyle: CandlestickBarStyle;
}

export interface CandlestickBarStyle extends Record<CandleType, CandleColors> {
  showWick: boolean;
  showBody: boolean;
  showBorder: boolean;
}

export class CandlestickPlotRenderer implements OHLCvPlotRenderer<CandlestickPlotOptions> {
  get name(): string {
    return this.constructor.name;
  }

  renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<CandlestickPlot>, viewport: Viewport): void {
    const { descriptor, drawing } = entry;
    const { priceAxis, timeAxis } = viewport;
    const { range: timeRange } = toRaw(timeAxis);
    const { content: ohlc, plotOptions } = descriptor?.options.data || {};

    if (!ohlc || !drawing) {
      throw new Error('Oops.');
    }

    const timePeriod = TIME_PERIODS_MAP.get(ohlc.step);
    if (!timePeriod) {
      console.error(`Illegal time period was found "${ohlc.step}"`);
      return;
    }

    resizeInPlace(drawing?.parts, bars.length);

    const parts = drawing?.parts;
    const barSpace: number = timeAxis.translate(timePeriod.barToTime(timeRange.from, 1) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;
    const options: CandleGraphicsOptions = { style: plotOptions.barStyle, x: 0, width: 0, yo: 0, yh: 0, yl: 0, yc: 0 };

    priceAxis.translateBatchInPlace(bars, [OHLCV_BAR_OPEN, OHLCV_BAR_HIGH, OHLCV_BAR_LOW, OHLCV_BAR_CLOSE]);
    timeAxis.translateBatchInPlace(bars, [OHLCV_BAR_TIMESTAMP]);

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      options.x = bar[OHLCV_BAR_TIMESTAMP];
      options.width = barWidth;
      options.yo = bar[OHLCV_BAR_OPEN];
      options.yh = bar[OHLCV_BAR_HIGH];
      options.yl = bar[OHLCV_BAR_LOW];
      options.yc = bar[OHLCV_BAR_CLOSE];

      if (parts[i] === undefined) {
        parts[i] = new CandleGraphics(options);
      } else {
        (parts[i] as CandleGraphics).invalidate(options);
      }
    }
  }
}
