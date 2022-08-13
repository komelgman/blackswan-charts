import { DataSourceEntry } from '@/model/datasource/DataSource';
import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { DragHandle } from '@/model/viewport/DragHandle';

export default interface Sketcher {
  draw(entry: DataSourceEntry, viewport: Viewport): void;
  contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];
  dragHandle(viewport: Viewport): DragHandle | undefined;
  // todo editdialog
  // todo: deside which event type should be used
  // drag(dataSourceEntry: DataSourceEntry, viewport: Viewport, event: DragMoveEvent): void;
}
