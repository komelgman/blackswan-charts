import { invertColor } from '@blackswan/foundation';
import { AbstractSketcher } from '@/model/chart/viewport/sketchers';
import LineGraphics from '@/model/chart/viewport/sketchers/graphics/LineGraphics';
import SquareHandle from '@/model/chart/viewport/sketchers/handles/SquareHandle';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { HLine } from '@/model/chart/types';

export class HLineSketcher extends AbstractSketcher<HLine> {
  protected draw(entry: DataSourceEntry<HLine>, viewport: DrawingProjection): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const { descriptor, drawing, mark: priceMark } = entry;
    const { data: line, locked } = descriptor.options;
    const { priceAxis } = viewport;
    const { main: width } = viewport.timeAxis.screenSize;
    const { range } = priceAxis;

    descriptor.visibleInViewport = line.def >= range.from && line.def <= range.to;
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    const y = priceAxis.translate(line.def);
    if (drawing === undefined) {
      entry.drawing = {
        parts: [new LineGraphics(0, y, width, y, line.style)],
        handles: { center: new SquareHandle(width / 2, y, locked, this.chartStyle.handleStyle, 'ns-resize') },
      };
    } else {
      (drawing.parts[0] as LineGraphics).invalidate({ x0: 0, y0: y, x1: width, y1: y, lineStyle: line.style });
      (drawing.handles.center as SquareHandle).invalidate(width / 2, y, locked);
    }

    const markText = priceAxis.formatPrice(line.def);

    if (priceMark === undefined) {
      entry.mark = {
        screenPos: y,
        textColor: invertColor(line.style.color),
        text: markText,
        bgColor: line.style.color,
        type: 'PriceMark',
      };
    } else {
      Object.assign(priceMark, {
        screenPos: y,
        textColor: invertColor(line.style.color),
        text: markText,
        bgColor: line.style.color,
        invalid: false,
      });
    }
  }

}
