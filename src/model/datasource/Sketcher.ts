import Viewport from '@/model/viewport/Viewport';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { DragHandle } from '@/model/viewport/DragHandle';
import { HandleId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';

export default interface Sketcher {
  draw(entry: DataSourceEntry, viewport: Viewport): void;
  contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[];
  dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined;
  // todo editdialog
}
