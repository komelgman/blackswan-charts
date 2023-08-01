import { toRaw } from 'vue';
import type { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { invertColor } from '@/misc/color';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import type { VLine } from '@/model/type-defs';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import LineGraphics from '@/model/sketchers/graphics/LineGraphics';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export default class VLineSketcher extends AbstractSketcher<VLine> {
  public draw(entry: DataSourceEntry<VLine>, viewport: Viewport): void {
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
      };
    } else {
      Object.assign(timeMark, {
        screenPos: x,
        textColor: invertColor(line.style.color),
        text: markText,
        invalid: false,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public dragHandle(viewport: Viewport, entry: DataSourceEntry<VLine>, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry.descriptor.options.type !== 'VLine'
      || entry.descriptor.options.locked
      || entry.drawing === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    return (e: DragMoveEvent) => {
      const { dataSource, timeAxis } = viewport;
      const rawDS = toRaw(dataSource);
      const { options, ref } = entry.descriptor;
      // only one handle and drag by body equals drag by handles.center
      const def = timeAxis.revert(timeAxis.translate(options.data.def) - e.dx);

      rawDS.update(ref, { data: { def } });
    };
  }
}
