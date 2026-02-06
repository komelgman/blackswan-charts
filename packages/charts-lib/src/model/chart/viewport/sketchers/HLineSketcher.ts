import type { DragMoveEvent } from '@/components/layered-canvas/events';
import { invertColor } from 'blackswan-foundation';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import { AbstractSketcher } from '@/model/chart/viewport/sketchers';
import LineGraphics from '@/model/chart/viewport/sketchers/graphics/LineGraphics';
import SquareHandle from '@/model/chart/viewport/sketchers/handles/SquareHandle';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';
import type { HLine } from '@/model/chart/types';

export class HLineSketcher extends AbstractSketcher<HLine> {
  protected draw(entry: DataSourceEntry<HLine>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const { descriptor, drawing, mark: priceMark } = entry;
    const { data: line, locked } = descriptor.options;
    const { priceAxis } = viewport;
    const { main: width } = viewport.timeAxis.screenSize;
    const { fraction, range } = priceAxis;

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

    const markText = line.def.toLocaleString(undefined, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public dragHandle(entry: DataSourceEntry<HLine>, viewport: Viewport, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry.descriptor.options.type !== 'HLine'
      || entry.descriptor.options.locked
      || entry.drawing === undefined
    ) {
      console.warn('IllegalState: object can\'t be dragged by this sketcher dragHandle');
      return undefined;
    }

    const { dataSource, priceAxis } = viewport;
    return (e: DragMoveEvent) => {
      const { options } = entry.descriptor;
      // only one handle and drag by body equals drag by handles.center
      const def = priceAxis.revert(priceAxis.translate(options.data.def) - e.dy);

      dataSource.update(entry.descriptor.ref, { data: { def } });
    };
  }
}
