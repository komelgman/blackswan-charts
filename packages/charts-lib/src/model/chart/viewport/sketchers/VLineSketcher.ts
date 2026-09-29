import { invertColor } from '@blackswan/foundation';
import { AbstractSketcher } from '@/model/chart/viewport/sketchers';
import LineGraphics from '@/model/chart/viewport/sketchers/graphics/LineGraphics';
import SquareHandle from '@/model/chart/viewport/sketchers/handles/SquareHandle';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { VLine } from '@/model/chart/types';

export class VLineSketcher extends AbstractSketcher<VLine> {
  protected draw(entry: DataSourceEntry<VLine>, viewport: DrawingProjection): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const { descriptor, drawing, mark: timeMark } = entry;
    const { data: line, locked } = descriptor.options;
    const { timeAxis } = viewport;
    const { main: height } = viewport.priceAxis.screenSize;
    const { range } = timeAxis;

    descriptor.visibleInViewport = line.def >= range.from && line.def <= range.to;
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    const x = timeAxis.translate(line.def);
    if (drawing === undefined) {
      entry.drawing = {
        parts: [new LineGraphics(x, 0, x, height, line.style)],
        handles: { center: new SquareHandle(x, height / 2, locked, this.chartStyle.handleStyle, 'ew-resize') },
      };
    } else {
      (drawing.parts[0] as LineGraphics).invalidate({ x0: x, y0: 0, x1: x, y1: height, lineStyle: line.style });
      (drawing.handles.center as SquareHandle).invalidate(x, height / 2, locked);
    }

    const markText: string = `${line.def}`;
    if (timeMark === undefined) {
      entry.mark = {
        screenPos: x,
        textColor: invertColor(line.style.color),
        text: markText,
        bgColor: line.style.color,
        type: 'TimeMark',
      };
    } else {
      Object.assign(timeMark, {
        screenPos: x,
        textColor: invertColor(line.style.color),
        text: markText,
        bgColor: line.style.color,
        invalid: false,
      });
    }
  }

}
