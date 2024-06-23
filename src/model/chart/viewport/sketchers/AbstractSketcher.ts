import type { MenuItem } from '@/components/context-menu/types';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import type Viewport from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';

export default abstract class AbstractSketcher<T> implements Sketcher<T> {
  protected chartStyle: ChartStyle | undefined;

  public setChartStyle(chartStyle: ChartStyle): void {
    this.chartStyle = chartStyle;
  }

  public invalidate(entry: DataSourceEntry<T>, viewport: Viewport): boolean {
    this.draw(entry, viewport);

    return entry.descriptor.valid || false;
  }

  protected abstract draw(entry: DataSourceEntry<T>, viewport: Viewport): void;

  public dragHandle(viewport: Viewport, entry: DataSourceEntry<T>, handle?: HandleId): DragHandle | undefined {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public contextmenu(dataSourceEntry: DataSourceEntry<T>): MenuItem[] {
    return [];
  }
}
