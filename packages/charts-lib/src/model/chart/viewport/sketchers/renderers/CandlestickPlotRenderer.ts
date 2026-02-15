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
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { HasType } from '@blackswan/foundation';
import BatchCandleGraphics from '@/model/chart/viewport/sketchers/graphics/BatchCandleGraphics';

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

    drawing.parts = [];

    const parts = drawing?.parts;
    const barSpace: number = timeAxis.translate(timePeriod.barToTime(timeRange.from, 1) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;
    const isBullish: boolean[] = new Array(bars.length);

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      isBullish[i] = bar[OHLCV_BAR_OPEN] <= bar[OHLCV_BAR_CLOSE];
    }

    priceAxis.translateBatchInPlace(bars, [OHLCV_BAR_OPEN, OHLCV_BAR_HIGH, OHLCV_BAR_LOW, OHLCV_BAR_CLOSE]);
    timeAxis.translateBatchInPlace(bars, [OHLCV_BAR_TIMESTAMP]);

    const bearishCandles = new BatchCandleGraphics(barWidth, plotOptions.barStyle, 'bearish');
    const bullishCandles = new BatchCandleGraphics(barWidth, plotOptions.barStyle, 'bullish');
    parts.push(bearishCandles, bullishCandles);

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      const [x, yo, yh, yl, yc] = bar;
      const candles = isBullish[i] ? bullishCandles : bearishCandles;

      candles.add(x, yo, yh, yl, yc);
    }
  }
}
