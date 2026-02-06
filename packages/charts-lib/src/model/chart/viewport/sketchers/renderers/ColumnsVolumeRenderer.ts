import {
  type OHLCvPlot,
  type OHLCvBar,
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
import type { HasStyle, HasType } from '@blackswan/foundation';
import BatchColumnGraphics from '@/model/chart/viewport/sketchers/graphics/BatchColumnGraphics';

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

    let maxValue = 0;
    for (let i = 0; i < bars.length; i++) {
      const volume = bars[i][OHLCV_BAR_VOLUME] || 0;
      if (volume > maxValue) { 
        maxValue = volume; 
      }
    }

    if (maxValue === 0) {
      return;
    }

    drawing.parts = [];

    const parts = drawing?.parts;
    const barSpace: number = timeAxis.translate(timePeriod.barToTime(timeRange.from, 1));
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;
    const { main: screenHeight } = priceAxis.screenSize;
    const heightFactor = (plotOptions.heightFactor || DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR) * (screenHeight / maxValue);
    const isInverted = priceAxis.inverted.value > 0;
    const baseY = isInverted ? 0 : screenHeight;
    const direction: 1 | -1 = isInverted ? 1 : -1;
    const { style: { bearish: bearishStyle, bullish: bullishStyle } } = plotOptions;

    timeAxis.translateBatchInPlace(bars, [OHLCV_BAR_TIMESTAMP]);

    const bearishColumns = new BatchColumnGraphics(barWidth, bearishStyle, baseY, direction);
    const bullishColumns = new BatchColumnGraphics(barWidth, bullishStyle, baseY, direction);
    parts.push(bearishColumns, bullishColumns);

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      const x = bar[OHLCV_BAR_TIMESTAMP];
      const height = (bar[OHLCV_BAR_VOLUME] || 0) * heightFactor;
      const columns = bar[OHLCV_BAR_OPEN] < bar[OHLCV_BAR_CLOSE] ? bullishColumns : bearishColumns;

      columns.add(x, height);
    }
  }
}
