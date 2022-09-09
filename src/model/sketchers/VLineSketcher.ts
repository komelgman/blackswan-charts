import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { invertColor } from '@/misc/color';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { HandleId } from '@/model/datasource/Drawing';
import { LineStyle } from '@/model/datasource/line/type-defs';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import VLine from '@/model/sketchers/graphics/VLine';
import { UTCTimestamp } from '@/model/type-defs';
import { DragHandle } from '@/model/viewport/DragHandle';
import Viewport from '@/model/viewport/Viewport';
import { toRaw } from 'vue';

export interface VLineOptions {
  def: UTCTimestamp;
  style: LineStyle;
}

export default class VLineSketcher extends AbstractSketcher {
  public draw(entry: DataSourceEntry<VLineOptions>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const [descriptor, drawing, timeMark] = entry;
    const { data: line, locked } = descriptor.options;
    const { timeAxis } = viewport;
    const { main: height } = viewport.priceAxis.screenSize;
    const { range } = timeAxis;

    descriptor.visibleInViewport = line.def >= range.from && line.def <= range.to;
    descriptor.valid = descriptor.visibleInViewport;
    descriptor.options.shared = true;

    if (!descriptor.visibleInViewport) {
      return;
    }

    const x = timeAxis.translate(line.def);
    if (drawing === undefined) {
      entry[1] = {
        parts: [new VLine(x, 0, height, line.style)],
        handles: { center: new SquareHandle(x, height / 2, locked, this.chartStyle.handleStyle, 'ew-resize') },
      };
    } else {
      (drawing.parts[0] as VLine).invalidate(x, 0, height, line.style);
      (drawing.handles.center as SquareHandle).invalidate(x, height / 2, locked);
    }

    const markText: string = `${line.def}`;
    if (timeMark === undefined) {
      entry[2] = {
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

  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry[0].options.type !== 'VLine'
      || entry[0].options.locked
      || entry[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    const { dataSource, timeAxis } = viewport;

    return (e: DragMoveEvent) => {
      const rawDS = toRaw(dataSource);
      const { options } = entry[0];
      // only one handle and drag by body equals drag by handles.center
      const def = timeAxis.revert(timeAxis.translate(options.data.def) - e.dx);

      rawDS.update(entry[0].ref, { options: { data: { def } } });
    };
  }

  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
