import Sketcher from '@/model/datasource/Sketcher';
import { DataSourceEntry } from '@/model/datasource/DataSource';
import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { LineFillStyle, RectStyle } from '@/model/datasource/line/type-defs';
import { DragHandle } from '@/model/viewport/DragHandle';
import { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { toRaw } from 'vue';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import HLine from '@/model/sketchers/graphics/HLine';
import { invertColor } from '@/misc/color';

export default class HLineSketcher implements Sketcher {
  // todo: extract to chartstyle
  private readonly handleStyle: RectStyle = { color: '#101010', border: { lineWidth: 2, color: '#1010BB', fill: LineFillStyle.Solid } };

  public draw(entry: DataSourceEntry, viewport: Viewport): void {
    const [options, drawing, priceMark] = entry;
    const { data: line, locked } = options;
    const { priceAxis } = viewport;
    const { main: width } = viewport.timeAxis.screenSize;
    const { fraction, range } = priceAxis;
    const markText = line.def.toLocaleString(undefined, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
    const y = priceAxis.translate(line.def);

    options.visibleInViewport = line.def >= range.from && line.def <= range.to;
    options.valid = options.visibleInViewport;

    if (!options.valid) {
      return;
    }

    if (drawing === undefined) {
      entry[1] = {
        parts: [new HLine(y, 0, width, line.style)],
        handles: { center: new SquareHandle(width / 2, y, locked, this.handleStyle) },
      };
    } else {
      (drawing.parts[0] as HLine).invalidate(y, 0, width, line.style);
      (drawing.handles.center as SquareHandle).invalidate(width / 2, y, locked);
    }

    if (priceMark === undefined) {
      entry[2] = {
        screenPos: y,
        textColor: invertColor(line.style.color),
        text: markText,
      }
    } else {
      Object.assign(priceMark, {
        screenPos: y,
        textColor: invertColor(line.style.color),
        text: markText,
        invalid: false,
      });
    }
  }

  public dragHandle(viewport: Viewport): DragHandle | undefined {
    const { dataSource, highlighted, priceAxis } = viewport;
    if (highlighted === undefined
      || highlighted[0].type !== 'HLine'
      || highlighted[0].locked
      || highlighted[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    // only one handle and drag by body equals drag by handles.center
    return (e: DragMoveEvent) => {
      const rawDS = toRaw(dataSource);
      rawDS.startTransaction();
      const [options, drawing] = highlighted;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const y = drawing?.handles.center.cy - priceAxis.inverted.value * e.dy;
      rawDS.update(options.id, { data: { def: priceAxis.revert(y) } })
      rawDS.endTransaction();
    };
  }

  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
