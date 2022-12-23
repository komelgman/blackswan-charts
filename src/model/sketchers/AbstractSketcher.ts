import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export default abstract class AbstractSketcher implements Sketcher {
  protected chartStyle: ChartStyle | undefined;

  public setChartStyle(chartStyle: ChartStyle): void {
    this.chartStyle = chartStyle;
  }

  public abstract draw(entry: DataSourceEntry, viewport: Viewport): void;
  public abstract dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;
  public abstract contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];
}
