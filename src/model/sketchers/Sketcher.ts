import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { ChartStyle } from '@/model/ChartStyle';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { HandleId } from '@/model/datasource/Drawing';
import { DragHandle } from '@/model/viewport/DragHandle';
import Viewport from '@/model/viewport/Viewport';

export default interface Sketcher {
  setChartStyle(chartStyle: ChartStyle): void;

  draw(entry: DataSourceEntry, viewport: Viewport): void;

  contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];

  dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;

  // todo editdialog
}
