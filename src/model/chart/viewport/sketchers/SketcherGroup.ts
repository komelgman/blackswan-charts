import type { MenuItem } from '@/components/context-menu/types';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';

export function matchSubtypeFromChartOptions(entry: DataSourceEntry): string {
  return entry.descriptor.options.data.plotOptions.type;
}

export default class SketcherGroup<T = any> implements Sketcher<T> {
  private readonly matcher: (entry: DataSourceEntry<T>) => string | undefined;
  private readonly subtypes: Map<string, Sketcher<T>> = new Map();

  constructor(subtypeMatcher: (entry: DataSourceEntry<T>) => string | undefined) {
    this.matcher = subtypeMatcher;
  }

  public addSubtype(subtype: string, sketcher: Sketcher<T>): SketcherGroup {
    this.subtypes.set(subtype, sketcher);
    return this;
  }

  private getSubtypeSketcher(entry: DataSourceEntry<T>): Sketcher<T> {
    const subtype = this.matcher(entry);
    if (subtype === undefined) {
      throw new Error(`IllegalState: can\\'t detect subtype for entry ${JSON.stringify(entry)}`);
    }

    const sketcher = this.subtypes.get(subtype);
    if (sketcher === undefined) {
      throw new Error(`IllegalState: no sketcher registered for subtype ${subtype}`);
    }

    return sketcher;
  }

  invalidate(entry: DataSourceEntry<T>, viewport: Viewport): boolean {
    return this.getSubtypeSketcher(entry).invalidate(entry, viewport);
  }

  setChartStyle(chartStyle: ChartStyle): void {
    this.subtypes.forEach((sketcher) => {
      sketcher.setChartStyle(chartStyle);
    });
  }

  contextmenu(entry: DataSourceEntry<T>): MenuItem[] {
    return this.getSubtypeSketcher(entry).contextmenu(entry);
  }

  dragHandle(entry: DataSourceEntry<T>, viewport: Viewport, handle?: HandleId): DragHandle | undefined {
    return this.getSubtypeSketcher(entry).dragHandle(entry, viewport, handle);
  }

  // todo editdialog
}
