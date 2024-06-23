import type TimeAxis from '@/model/chart/axis/TimeAxis';
import AbstractSketcher from '@/model/chart/viewport/sketchers/AbstractSketcher';
import type { CandleGraphicsOptions } from '@/model/chart/viewport/sketchers/graphics/CandleGraphics';
import CandleGraphics from '@/model/chart/viewport/sketchers/graphics/CandleGraphics';
import type Viewport from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, Drawing, Graphics } from '@/model/datasource/types';
import type { OHLCv, Price, Range, TimePeriod, UTCTimestamp } from '@/model/chart/types';
import type { HasStyle, HasType } from 'src/model/type-defs/optional';
import { toRaw } from 'vue';

const resizeArray = (array: Graphics[], newSize: number): Graphics[] => {
  if (array.length === newSize) {
    return array;
  }

  const changeSize = newSize - array.length;
  if (changeSize > 0) {
    return array.splice(0, 0, ... Array(changeSize).fill(undefined));
  }

  return array.splice(0, -changeSize);
};

export declare type OHLCvPipeOptions = HasType<"OHLCvPipeOptions"> & {
  symbol: string;
  step: TimePeriod;
  // offset from timeAxis in count of step
  fromOffset?: number; // default 0
  toOffset?: number; // default 0
}

export declare type OHLCvChart<Style> = { content?: OHLCv } & { pipeOptions: OHLCvPipeOptions } & HasStyle<Style>;

export default class OHLCvChartSketcher extends AbstractSketcher<OHLCvChart<any>> {

  public invalidate(entry: DataSourceEntry<OHLCvChart<any>>, viewport: Viewport): boolean {
    const { timeAxis, dataSource } = viewport;

    const ohlc = entry.descriptor.options.data.content;
    if (!ohlc || this.needUpdateData(ohlc, timeAxis)) {
      dataSource.requestDataUpdate(entry);
    }

    return super.invalidate(entry, viewport);
  }

  private needUpdateData(ohlc: OHLCv, timeAxis: TimeAxis): boolean {
    const timeRangeFrom = timeAxis.range.from;
    const timeRangeTo = timeAxis.range.to;
    let result = false;

    if (timeRangeFrom < ohlc.loaded.from && ohlc.loaded.from > ohlc.available.from) {
      // todo:
      console.log({ timeRangeFrom, lf: ohlc.loaded.from, af: ohlc.available.from });
      result = true;
    }

    if (timeRangeTo > ohlc.loaded.to && ohlc.loaded.to < ohlc.available.to) {
      // todo:
      result = true;
    }

    return result;
  }

  protected draw(entry: DataSourceEntry<OHLCvChart<any>>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    let { descriptor, drawing } = entry;
    const { priceAxis, timeAxis } = viewport;

    const ohlc = toRaw(descriptor?.options.data).content;
    if (!ohlc) {
      return;
    }

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

    const style = toRaw(descriptor?.options.data.style);
    const parts = resizeArray(drawing?.parts, bars.length);
    const barSpace: number = timeAxis.translate((timeRange.from + ohlc.step) as UTCTimestamp);
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
        style
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
    const { loaded, step: ohlcStep, values: ohlcValues } = ohlc;
    const { from: ohlcFrom } = loaded;
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
