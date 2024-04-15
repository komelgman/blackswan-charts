import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import type Sketcher from '@/model/sketchers/Sketcher';
import type { SubtypedData } from '@/model/type-defs';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export default class SubtypedSketcher<T extends SubtypedData> extends AbstractSketcher<T> {
  private readonly sketchers: Record<string, Sketcher<T>>;

  constructor(sketchers: Record<string, Sketcher<T>>) {
    super();
    this.sketchers = sketchers;
  }

  public setChartStyle(chartStyle: ChartStyle): void {
    super.setChartStyle(chartStyle);

    for (const sketcher of Object.values(this.sketchers)) {
      sketcher.setChartStyle(chartStyle);
    }
  }

  public draw(entry: DataSourceEntry<T>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    this.getSketcher(entry.descriptor.options.data.subtype).draw(entry, viewport);
  }

  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    return this.getSketcher(entry.descriptor.options.data.subtype).dragHandle(viewport, entry, handle);
  }

  public contextmenu(entry: DataSourceEntry): MenuItem[] {
    return this.getSketcher(entry.descriptor.options.data.subtype).contextmenu(entry);
  }

  private getSketcher(sybtype: string): Sketcher<T> {
    const result = this.sketchers[sybtype];
    if (!result) {
      throw new Error(`Oops. Illegal argument: subtype ${sybtype} was not found in this.sketchers ${JSON.stringify(this.sketchers)}`);
    }

    return result;
  }
}
