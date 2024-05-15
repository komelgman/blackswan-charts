import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { ChartStyle } from '@/model/ChartStyle';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type Viewport from '@/model/chart/viewport/Viewport';

export default interface Sketcher<T = any> {
  invalidate(entry: DataSourceEntry<T>, viewport: Viewport): boolean;

  setChartStyle(chartStyle: ChartStyle): void;

  contextmenu(dataSourceEntry: DataSourceEntry<T>): MenuItem[];

  dragHandle(viewport: Viewport, entry: DataSourceEntry<T>, handle?: HandleId): DragHandle | undefined;

  // todo editdialog
}
