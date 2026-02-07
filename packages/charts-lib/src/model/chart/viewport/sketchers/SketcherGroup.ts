import type { MenuItem } from '@blackswan/context-menu/types';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';
import type { Sketcher } from '@/model/chart/viewport/sketchers/Sketcher';

export declare type EntitySubtypeResolver = (entry: DataSourceEntry) => string | undefined;

export function subtypeFromPlotOptionsType(entry: DataSourceEntry): string {
  return entry.descriptor.options.data.plotOptions.type;
}

export function subtypeFromPlotOptionsStyleType(entry: DataSourceEntry): string {
  return entry.descriptor.options.data.plotOptions.style.type;
}

export class SketcherGroup<T = any> implements Sketcher<T> {
  private readonly subtypeResolver: EntitySubtypeResolver;
  private readonly subtypes: Map<string, Sketcher<T>> = new Map();

  constructor(entitySubtypeResolver: EntitySubtypeResolver) {
    this.subtypeResolver = entitySubtypeResolver;
  }

  public addSubtype(subtype: string, sketcher: Sketcher<T>): SketcherGroup {
    this.subtypes.set(subtype, sketcher);
    return this;
  }

  private getSubtypeSketcher(entry: DataSourceEntry<T>): Sketcher<T> {
    const subtype = this.subtypeResolver(entry);
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
