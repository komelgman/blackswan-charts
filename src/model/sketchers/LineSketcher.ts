import { toRaw } from 'vue';
import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { invertColor } from '@/misc/color';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import type { LineStyle } from '@/model/datasource/line/type-defs';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import VLineGraphics from '@/model/sketchers/graphics/VLineGraphics';
import type { UTCTimestamp } from '@/model/type-defs';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export interface LineOptions {
  def: UTCTimestamp;
  style: LineStyle;
}

export default class VLineSketcher extends AbstractSketcher {
  public draw(entry: DataSourceEntry<LineOptions>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const [descriptor, drawing] = entry;

    const { data: line, locked } = descriptor.options;
    const { timeAxis } = viewport;
    const { main: height } = viewport.priceAxis.screenSize;
    const { range } = timeAxis;

    descriptor.visibleInViewport = line.def >= range.from && line.def <= range.to; // todo
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    // todo
    const x = timeAxis.translate(line.def);
    if (drawing === undefined) {
      entry[1] = {
        parts: [new VLineGraphics(x, 0, height, line.style)],
        handles: { center: new SquareHandle(x, height / 2, locked, this.chartStyle.handleStyle, 'ew-resize') },
      };
    } else {
      (drawing.parts[0] as VLineGraphics).invalidate(x, 0, height, line.style);
      (drawing.handles.center as SquareHandle).invalidate(x, height / 2, locked);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry[0].options.type !== 'Line'
      || entry[0].options.locked
      || entry[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    // todo
    return (e: DragMoveEvent) => {
      const { dataSource, timeAxis } = viewport;
      const rawDS = toRaw(dataSource);
      const { options, ref } = entry[0];
      // only one handle and drag by body equals drag by handles.center
      const def = timeAxis.revert(timeAxis.translate(options.data.def) - e.dx);

      rawDS.update(ref, { data: { def } });
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
