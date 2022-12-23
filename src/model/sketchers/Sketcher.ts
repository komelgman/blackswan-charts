import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export default interface Sketcher {
  setChartStyle(chartStyle: ChartStyle): void;

  draw(entry: DataSourceEntry, viewport: Viewport): void;

  contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];

  dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;

  // todo editdialog
}
