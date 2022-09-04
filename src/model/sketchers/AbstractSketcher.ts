import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { DragHandle } from '@/model/viewport/DragHandle';
import { HandleId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import Sketcher from '@/model/sketchers/Sketcher';
import { ChartStyle } from '@/model/ChartStyle';

export default abstract class AbstractSketcher implements Sketcher {
  protected chartStyle: ChartStyle | undefined;

  public setChartStyle(chartStyle: ChartStyle): void {
    this.chartStyle = chartStyle;
  }

  public abstract draw(entry: DataSourceEntry, viewport: Viewport): void;
  public abstract dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;
  public abstract contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];
}
