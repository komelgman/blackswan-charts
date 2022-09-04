import Sketcher from '@/model/datasource/Sketcher';
import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { LineFillStyle, LineStyle, RectStyle } from '@/model/datasource/line/type-defs';
import { DragHandle } from '@/model/viewport/DragHandle';
import { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { toRaw } from 'vue';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import HLine from '@/model/sketchers/graphics/HLine';
import { invertColor } from '@/misc/color';
import { HandleId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { Price } from '@/model/type-defs';

export interface HLineOptions {
  def: Price;
  style: LineStyle;
}

export default class HLineSketcher implements Sketcher {
  // todo: extract to chartstyle
  private readonly handleStyle: RectStyle = { color: '#101010', border: { lineWidth: 2, color: '#1010BB', fill: LineFillStyle.Solid } };

  public draw(entry: DataSourceEntry<HLineOptions>, viewport: Viewport): void {
    const [options, drawing, priceMark] = entry;
    const { data: line, locked } = options;
    const { priceAxis } = viewport;
    const { main: width } = viewport.timeAxis.screenSize;
    const { fraction, range } = priceAxis;

    options.visibleInViewport = line.def >= range.from && line.def <= range.to;
    options.valid = options.visibleInViewport;

    if (!options.visibleInViewport) {
      return;
    }

    const y = priceAxis.translate(line.def);
    if (drawing === undefined) {
      entry[1] = {
        parts: [new HLine(y, 0, width, line.style)],
        handles: { center: new SquareHandle(width / 2, y, locked, this.handleStyle, 'ns-resize') },
      };
    } else {
      (drawing.parts[0] as HLine).invalidate(y, 0, width, line.style);
      (drawing.handles.center as SquareHandle).invalidate(width / 2, y, locked);
    }

    const markText = line.def.toLocaleString(undefined, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });

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

  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry[0].type !== 'HLine'
      || entry[0].locked
      || entry[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    const { dataSource, priceAxis } = viewport;
    return (e: DragMoveEvent) => {
      const rawDS = toRaw(dataSource);
      const [options] = entry;
      // only one handle and drag by body equals drag by handles.center
      const def = priceAxis.revert(priceAxis.translate(options.data.def) - priceAxis.inverted.value * e.dy);

      rawDS.update(options.id, { data: { def } });
    };
  }

  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
