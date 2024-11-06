import { toRaw } from 'vue';
import {
  type OHLCvPlot,
  type OHLCvBar,
  barToTime,
  type UTCTimestamp,
  type CandleType,
  type CandleColors,
  OHLCV_BAR_TIMESTAMP,
  OHLCV_BAR_OPEN,
  OHLCV_BAR_HIGH,
  OHLCV_BAR_LOW,
  OHLCV_BAR_CLOSE,
} from '@/model/chart/types';
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
    const { content: ohlc, plotOptions } = toRaw(descriptor?.options.data);

    if (!ohlc || !drawing) {
      throw new Error('Oops.');
    }

    resizeInPlace(drawing?.parts, bars.length);

    const parts = drawing?.parts;
    const barSpace: number = timeAxis.translate(barToTime(timeRange.from, 1, ohlc.step) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      const options: CandleGraphicsOptions = {
        x: timeAxis.translate(bar[OHLCV_BAR_TIMESTAMP]),
        width: barWidth,
        yo: priceAxis.translate(bar[OHLCV_BAR_OPEN]),
        yh: priceAxis.translate(bar[OHLCV_BAR_HIGH]),
        yl: priceAxis.translate(bar[OHLCV_BAR_LOW]),
        yc: priceAxis.translate(bar[OHLCV_BAR_CLOSE]),
        style: plotOptions.barStyle,
      };

      if (parts[i] === undefined) {
        parts[i] = new CandleGraphics(options);
      } else {
        (parts[i] as CandleGraphics).invalidate(options);
      }
    }
  }
}
