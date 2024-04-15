import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export default abstract class AbstractSketcher<T> implements Sketcher<T> {
  protected chartStyle: ChartStyle | undefined;

  public setChartStyle(chartStyle: ChartStyle): void {
    this.chartStyle = chartStyle;
  }

  public abstract draw(entry: DataSourceEntry<T>, viewport: Viewport): void;
  public dragHandle(viewport: Viewport, entry: DataSourceEntry<T>, handle?: HandleId): DragHandle | undefined {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public contextmenu(dataSourceEntry: DataSourceEntry<T>): MenuItem[] {
    return [];
  }

  public invalidate(entry: DataSourceEntry<T>, viewport: Viewport): boolean {
    this.draw(entry, viewport);
    return true;
  }
}
