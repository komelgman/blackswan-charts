import type { MenuItem } from '@/components/context-menu/types';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';

export default interface Sketcher<T = any> {
  invalidate(entry: DataSourceEntry<T>, viewport: Viewport): boolean;

  setChartStyle(chartStyle: ChartStyle): void;

  contextmenu(dataSourceEntry: DataSourceEntry<T>): MenuItem[];

  dragHandle(viewport: Viewport, entry: DataSourceEntry<T>, handle?: HandleId): DragHandle | undefined;

  // todo editdialog
}
