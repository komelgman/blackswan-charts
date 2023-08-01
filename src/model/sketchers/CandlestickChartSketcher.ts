import { toRaw } from 'vue';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { Graphics } from '@/model/datasource/Drawing';
import type Drawing from '@/model/datasource/Drawing';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import type { CandleGraphicsOptions } from '@/model/sketchers/graphics/CandleGraphics';
import CandleGraphics from '@/model/sketchers/graphics/CandleGraphics';
import type { OHLCvChart, OHLCv, Price, Range, UTCTimestamp } from '@/model/type-defs';
import type Viewport from '@/model/viewport/Viewport';

const resizeArray = (array: Graphics[], newSize: number): Graphics[] => {
  const changeSize = newSize - array.length;
  if (changeSize > 0) {
    return array.concat(Array(changeSize).fill(undefined));
  }

  return array.slice(0, newSize);
};

export default class CandlestickChartSketcher extends AbstractSketcher<OHLCvChart> {
  public static readonly NAME: string = 'Candlestick';

  public draw(entry: DataSourceEntry<OHLCvChart>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    let { descriptor, drawing } = entry;
    const { priceAxis, timeAxis, dataSource } = viewport;
    const dataProvider = dataSource.getDataProvider(descriptor.options.data.dataProvider);

    if (dataProvider === undefined) {
      console.warn(`DataSource ${dataSource.id} hasn\'t have dataProvider ${descriptor.options.data.dataProvider}`);
      return;
    }

    const ohlc = toRaw(dataProvider?.data) as OHLCv;
    const { range: priceRange } = priceAxis;
    const { range: timeRange } = timeAxis;
    const bars: [UTCTimestamp, Price, Price, Price, Price, number?][] = this.visibleBars(ohlc, priceRange, timeRange);

    descriptor.visibleInViewport = bars.length > 0;
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    if (drawing === undefined) {
      entry.drawing = {
        parts: [],
        handles: {},
      } as Drawing;

      drawing = entry.drawing;
    }

    const parts = resizeArray(drawing?.parts, bars.length);
    const barSpace: number = timeAxis.translate((timeRange.from + ohlc.step) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;

    for (let i = 0; i < bars.length; ++i) {
      const options: CandleGraphicsOptions = {
        x: timeAxis.translate(bars[i][0]),
        width: barWidth,
        yo: priceAxis.translate(bars[i][1]),
        yh: priceAxis.translate(bars[i][2]),
        yl: priceAxis.translate(bars[i][3]),
        yc: priceAxis.translate(bars[i][4]),
        style: descriptor.options.data.style
      };

      if (parts[i] === undefined) {
        parts[i] = new CandleGraphics(options);
      } else {
        (parts[i] as CandleGraphics).invalidate(options);
      }
    }

    drawing.parts = parts;
  }

  private visibleBars(ohlc: OHLCv, priceRange: Readonly<Range<Price>>, timeRange: Readonly<Range<UTCTimestamp>>)
    : [UTCTimestamp, Price, Price, Price, Price, number?][] {
    const { from: ohlcFrom, step: ohlcStep, values: ohlcValues } = ohlc;
    const barCount = ohlcValues.length;

    if (ohlcFrom > timeRange.to || (ohlcFrom + ohlcStep * barCount) < timeRange.from) {
      return [];
    }

    const firstVisibleBar = Math.floor((timeRange.from - ohlcFrom) / ohlcStep);
    const lastVisibleBar = Math.ceil((timeRange.to - ohlcFrom) / ohlcStep);

    const firstIndex = Math.max(0, firstVisibleBar);
    const lastIndex = Math.min(barCount - 1, lastVisibleBar);
    const result: [UTCTimestamp, Price, Price, Price, Price, number?][] = new Array(lastIndex - firstIndex + 1);

    for (let i = firstIndex; i <= lastIndex; ++i) {
      const [o, h, l, c, v] = ohlcValues[i];
      result[i - firstIndex] = [(ohlcFrom + i * ohlcStep) as UTCTimestamp, o, h, l, c, v];
    }

    return result;
  }
}
