import {
  type OHLCvPlot,
  type OHLCvBar,
  type UTCTimestamp,
  type CandleType,
  type BarColors,
  OHLCV_BAR_VOLUME,
  OHLCV_BAR_OPEN,
  OHLCV_BAR_CLOSE,
  OHLCV_BAR_TIMESTAMP,
} from '@/model/chart/types';
import { TIME_PERIODS_MAP } from '@/model/chart/types/time';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import { DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR } from '@/model/chart/viewport/sketchers';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { resizeInPlace } from '@/misc/array.resizeInPlace';
import type { HasStyle, HasType } from '@/model/type-defs/optional';
import type { VolumeColumnGraphicsOptions } from '@/model/chart/viewport/sketchers/graphics/VolumeColumnGraphics';
import VolumeColumnGraphics from '@/model/chart/viewport/sketchers/graphics/VolumeColumnGraphics';

export declare type ColumnsVolumeIndicator = OHLCvPlot<ColumnsVolumeIndicatorOptions>;

export interface ColumnsVolumeIndicatorOptions extends HasType<'VolumeIndicator'>, HasStyle<ColumnsVolumeIndicatorStyle> {
  heightFactor?: number;
}

export interface ColumnsVolumeIndicatorStyle extends Record<CandleType, BarColors>, HasType<'Columns'> {
}

export class ColumnsVolumeRenderer implements OHLCvPlotRenderer<ColumnsVolumeIndicatorOptions> {
  get name(): string {
    return this.constructor.name;
  }

  renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<ColumnsVolumeIndicator>, viewport: Viewport): void {
    const { descriptor, drawing } = entry;
    const { priceAxis, timeAxis } = viewport;
    const { range: timeRange } = timeAxis;
    const { content: ohlc, plotOptions } = descriptor?.options.data || {};

    if (!ohlc || !drawing) {
      throw new Error('Oops.');
    }

    const timePeriod = TIME_PERIODS_MAP.get(ohlc.step);
    if (!timePeriod) {
      console.error(`Illegal time period was found "${ohlc.step}"`);
      return;
    }

    const maxValue = Math.max(...bars.map((bar) => bar[OHLCV_BAR_VOLUME] || 0));
    if (maxValue === 0) {
      return;
    }

    resizeInPlace(drawing?.parts, bars.length);

    const parts = drawing?.parts;
    const barSpace: number = timeAxis.translate(timePeriod.barToTime(timeRange.from, 1) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;
    const heightFactor = (plotOptions.heightFactor || DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR) * (priceAxis.screenSize.main / maxValue);
    const bearishStyle = plotOptions.style.bearish;
    const bullishStyle = plotOptions.style.bullish;
    const options: VolumeColumnGraphicsOptions = { x: 0, width: barWidth, height: 0, colors: bearishStyle };

    timeAxis.translateBatchInPlace(bars, [OHLCV_BAR_TIMESTAMP]);

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      options.x = bar[OHLCV_BAR_TIMESTAMP];
      options.height = (bar[OHLCV_BAR_VOLUME] || 0) * heightFactor;
      options.colors = bar[OHLCV_BAR_OPEN] < bar[OHLCV_BAR_CLOSE] ? bullishStyle : bearishStyle;

      if (parts[i] === undefined) {
        parts[i] = new VolumeColumnGraphics(options);
      } else {
        (parts[i] as VolumeColumnGraphics).invalidate(options);
      }
    }
  }
}
