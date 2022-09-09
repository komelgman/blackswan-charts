import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { invertColor } from '@/misc/color';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { HandleId } from '@/model/datasource/Drawing';
import { LineStyle } from '@/model/datasource/line/type-defs';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import HLine from '@/model/sketchers/graphics/HLine';
import SquareHandle from '@/model/sketchers/graphics/SquareHandle';
import { Price } from '@/model/type-defs';
import { DragHandle } from '@/model/viewport/DragHandle';
import Viewport from '@/model/viewport/Viewport';
import { toRaw } from 'vue';

export interface HLineOptions {
  def: Price;
  style: LineStyle;
}

export default class HLineSketcher extends AbstractSketcher {
  public draw(entry: DataSourceEntry<HLineOptions>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const [descriptor, drawing, priceMark] = entry;
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
      entry[1] = {
        parts: [new HLine(y, 0, width, line.style)],
        handles: { center: new SquareHandle(width / 2, y, locked, this.chartStyle.handleStyle, 'ns-resize') },
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

  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry[0].options.type !== 'HLine'
      || entry[0].options.locked
      || entry[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    const { dataSource, priceAxis } = viewport;
    return (e: DragMoveEvent) => {
      const rawDS = toRaw(dataSource);
      const { options } = entry[0];
      // only one handle and drag by body equals drag by handles.center
      const def = priceAxis.revert(priceAxis.translate(options.data.def) - priceAxis.inverted.value * e.dy);

      rawDS.update(entry[0].ref, { options: { data: { def } } });
    };
  }

  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
