import { toRaw } from 'vue';
import { type OHLCvChart, type OHCLvBar, barToTime, type UTCTimestamp } from '@/model/chart/types';
import type { ChartRenderer } from '@/model/chart/viewport/sketchers/renderers';
import type { CandleGraphicsOptions } from '@/model/chart/viewport/sketchers/graphics/CandleGraphics';
import CandleGraphics from '@/model/chart/viewport/sketchers/graphics/CandleGraphics';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { resize as resizeArray } from '@/misc/array.resize';

// eslint-disable-next-line import/prefer-default-export
export class CandlestickChartRenderer implements ChartRenderer {
  get name(): string {
    return this.constructor.name;
  }

  renderBarsToEntry(bars: OHCLvBar[], entry: DataSourceEntry<OHLCvChart<any>>, viewport: Viewport): void {
    const { descriptor, drawing } = entry;
    const { priceAxis, timeAxis } = viewport;
    const { range: timeRange } = timeAxis;
    const ohlc = toRaw(descriptor?.options.data).content;

    if (!ohlc || !drawing) {
      throw new Error('Oops.');
    }

    resizeArray(drawing?.parts, bars.length);

    const parts = drawing?.parts;
    const style = toRaw(descriptor?.options.data.style);
    const barSpace: number = timeAxis.translate(barToTime(timeRange.from, 1, ohlc.step) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;

    for (let i = 0; i < bars.length; ++i) {
      const bar = bars[i];
      const options: CandleGraphicsOptions = {
        x: timeAxis.translate(bar[0]),
        width: barWidth,
        yo: priceAxis.translate(bar[1]),
        yh: priceAxis.translate(bar[2]),
        yl: priceAxis.translate(bar[3]),
        yc: priceAxis.translate(bar[4]),
        style,
      };

      if (parts[i] === undefined) {
        parts[i] = new CandleGraphics(options);
      } else {
        (parts[i] as CandleGraphics).invalidate(options);
      }
    }
  }
}
