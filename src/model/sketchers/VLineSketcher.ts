import Sketcher from '@/model/datasource/Sketcher';
import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { LineFillStyle, LineStyle, RectStyle } from '@/model/datasource/line/type-defs';
import { DragHandle } from '@/model/viewport/DragHandle';
import { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { toRaw } from 'vue';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import { invertColor } from '@/misc/color';
import { HandleId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import VLine from '@/model/sketchers/graphics/VLine';
import { UTCTimestamp } from '@/model/type-defs';

export interface VLineOptions {
  def: UTCTimestamp;
  style: LineStyle;
}

export default class VLineSketcher implements Sketcher {
  // todo: extract to chartstyle
  private readonly handleStyle: RectStyle = { color: '#101010', border: { lineWidth: 2, color: '#1010BB', fill: LineFillStyle.Solid } };

  public draw(entry: DataSourceEntry<VLineOptions>, viewport: Viewport): void {
    const [options, drawing, timeMark] = entry;
    const { data: line, locked } = options;
    const { timeAxis } = viewport;
    const { main: height } = viewport.priceAxis.screenSize;
    const { range } = timeAxis;

    options.visibleInViewport = line.def >= range.from && line.def <= range.to;
    options.valid = options.visibleInViewport;

    if (!options.visibleInViewport) {
      return;
    }

    const x = timeAxis.translate(line.def);
    if (drawing === undefined) {
      entry[1] = {
        parts: [new VLine(x, 0, height, line.style)],
        handles: { center: new SquareHandle(x, height / 2, locked, this.handleStyle, 'ew-resize') },
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
      }
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
      || entry[0].type !== 'VLine'
      || entry[0].locked
      || entry[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    const { dataSource, timeAxis } = viewport;

    return (e: DragMoveEvent) => {
      const rawDS = toRaw(dataSource);
      const [options] = entry;
      // only one handle and drag by body equals drag by handles.center
      const def = timeAxis.revert(timeAxis.translate(options.data.def) - e.dx);

      rawDS.update(options.id, { data: { def } });
    };
  }

  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
