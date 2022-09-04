import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { DragHandle } from '@/model/viewport/DragHandle';
import { HandleId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { ChartStyle } from '@/model/ChartStyle';

export default interface Sketcher {
  setChartStyle(chartStyle: ChartStyle): void;
  draw(entry: DataSourceEntry, viewport: Viewport): void;
  contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];
  dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;
  // todo editdialog
}
