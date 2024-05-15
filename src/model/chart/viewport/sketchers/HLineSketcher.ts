import { toRaw } from 'vue';
import type { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { invertColor } from '@/misc/color';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HLine } from '@/model/type-defs';
import type { HandleId } from '@/model/datasource/Drawing';
import AbstractSketcher from '@/model/chart/viewport/sketchers/AbstractSketcher';
import LineGraphics from '@/model/chart/viewport/sketchers/graphics/LineGraphics';
import SquareHandle from '@/model/chart/viewport/sketchers/handles/SquareHandle';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type Viewport from '@/model/chart/viewport/Viewport';

export default class HLineSketcher extends AbstractSketcher<HLine> {
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
      };
    } else {
      Object.assign(priceMark, {
        screenPos: y,
        textColor: invertColor(line.style.color),
        text: markText,
        invalid: false,
      });
    }
  }

  public dragHandle(viewport: Viewport, entry: DataSourceEntry<HLine>, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry.descriptor.options.type !== 'HLine'
      || entry.descriptor.options.locked
      || entry.drawing === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    const { dataSource, priceAxis } = viewport;
    return (e: DragMoveEvent) => {
      const rawDS = toRaw(dataSource);
      const { options } = entry.descriptor;
      // only one handle and drag by body equals drag by handles.center
      const def = priceAxis.revert(priceAxis.translate(options.data.def) - priceAxis.inverted.value * e.dy);

      rawDS.update(entry.descriptor.ref, { data: { def } });
    };
  }
}
