import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { Graphics, HandleId } from '@/model/datasource/Drawing';
import type Drawing from '@/model/datasource/Drawing';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import type { CandleGraphicsOptions } from '@/model/sketchers/graphics/CandleGraphics';
import CandleGraphics from '@/model/sketchers/graphics/CandleGraphics';
import type { HLOC, Price, Range, UTCTimestamp } from '@/model/type-defs';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

const resizeArray = (array: Graphics[], newSize: number): Graphics[] => {
  const changeSize = newSize - array.length;
  if (changeSize > 0) {
    return array.concat(Array(changeSize).fill(undefined));
  }

  return array.slice(0, newSize);
};

export default class CandleChartSketcher extends AbstractSketcher {
  public draw(entry: DataSourceEntry<HLOC>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    let { descriptor, drawing } = entry;
    const { data: hloc } = descriptor.options;
    const { priceAxis, timeAxis } = viewport;
    const { range: priceRange } = priceAxis;
    const { range: timeRange } = timeAxis;

    const bars: [UTCTimestamp, Price, Price, Price, Price, number?][] = this.visibleBars(hloc, priceRange, timeRange);

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
    const barSpace: number = timeAxis.translate((timeRange.from + hloc.step) as UTCTimestamp);
    const barGap = Math.max(1, Math.ceil(0.4 * barSpace));
    const barWidth = barSpace - barGap;

    for (let i = 0; i < bars.length; ++i) {
      const options: CandleGraphicsOptions = {
        x: timeAxis.translate(bars[i][0]),
        width: barWidth,
        yh: priceAxis.translate(bars[i][1]),
        yl: priceAxis.translate(bars[i][2]),
        yo: priceAxis.translate(bars[i][3]),
        yc: priceAxis.translate(bars[i][4]),
        style: this.chartStyle.hloc.candleStyle
      };

      if (parts[i] === undefined) {
        parts[i] = new CandleGraphics(options);
      } else {
        (parts[i] as CandleGraphics).invalidate(options);
      }
    }

    drawing.parts = parts;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }

  private visibleBars(hloc: HLOC, priceRange: Readonly<Range<Price>>, timeRange: Readonly<Range<UTCTimestamp>>)
    : [UTCTimestamp, Price, Price, Price, Price, number?][] {
    const { from: hlocFrom, step: hlocStep, values: hlocValues } = hloc;
    const barCount = hlocValues.length;

    if (hlocFrom > timeRange.to || (hlocFrom + hlocStep * barCount) < timeRange.from) {
      return [];
    }

    const firstVisibleBar = Math.floor((timeRange.from - hlocFrom) / hlocStep);
    const lastVisibleBar = Math.ceil((timeRange.to - hlocFrom) / hlocStep);

    const firstIndex = Math.max(0, firstVisibleBar);
    const lastIndex = Math.min(barCount - 1, lastVisibleBar);
    const result: [UTCTimestamp, Price, Price, Price, Price, number?][] = new Array(lastIndex - firstIndex + 1);

    for (let i = firstIndex; i <= lastIndex; ++i) {
      const [h, l, o, c, v] = hlocValues[i];
      result[i - firstIndex] = [(hlocFrom + i * hlocStep) as UTCTimestamp, h, l, o, c, v];
    }

    return result;
  }
}
