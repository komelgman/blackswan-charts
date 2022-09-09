import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { ChartStyle } from '@/model/ChartStyle';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { HandleId } from '@/model/datasource/Drawing';
import Sketcher from '@/model/sketchers/Sketcher';
import { DragHandle } from '@/model/viewport/DragHandle';
import Viewport from '@/model/viewport/Viewport';

export default abstract class AbstractSketcher implements Sketcher {
  protected chartStyle: ChartStyle | undefined;

  public setChartStyle(chartStyle: ChartStyle): void {
    this.chartStyle = chartStyle;
  }

  public abstract draw(entry: DataSourceEntry, viewport: Viewport): void;
  public abstract dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;
  public abstract contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];
}
