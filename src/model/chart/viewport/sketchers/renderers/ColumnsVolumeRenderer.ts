import { toRaw } from 'vue';
import { type OHLCvPlot, type OHLCvBar, barToTime, type UTCTimestamp, type CandleType, type BarColors } from '@/model/chart/types';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { resize as resizeArray } from '@/misc/array.resize';
import type { HasStyle, HasType } from '@/model/type-defs/optional';
import type { VolumeColumnGraphicsOptions } from '@/model/chart/viewport/sketchers/graphics/CandleGraphics copy';
import VolumeColumnGraphics from '@/model/chart/viewport/sketchers/graphics/CandleGraphics copy';

export declare type ColumnsVolumeIndicator = OHLCvPlot<ColumnsVolumeIndicatorOptions>;

export interface ColumnsVolumeIndicatorOptions extends HasType<'VolumeIndicator'>, HasStyle<ColumnsVolumeIndicatorStyle> {}

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
    const { content: ohlc, plotOptions } = toRaw(descriptor?.options.data);

    if (!ohlc || !drawing) {
      throw new Error('Oops.');
    }

    const maxValue = Math.max(...bars.map((bar) => bar[5] || 0));
    if (maxValue === 0) {
      return;
    }

    resizeArray(drawing?.parts, bars.length);

    const parts = drawing?.parts;
    const barSpace: number = timeAxis.translate(barToTime(timeRange.from, 1, ohlc.step) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      const options: VolumeColumnGraphicsOptions = {
        x: timeAxis.translate(bar[0]),
        width: barWidth,
        height: ((bar[5] || 0) / maxValue) * priceAxis.screenSize.main * 0.25,
        colors: plotOptions.style[bar[1] > bar[4] ? 'bullish' : 'bearish'],
      };

      if (parts[i] === undefined) {
        parts[i] = new VolumeColumnGraphics(options);
      } else {
        (parts[i] as VolumeColumnGraphics).invalidate(options);
      }
    }
  }
}
