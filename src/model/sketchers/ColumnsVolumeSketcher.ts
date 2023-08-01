import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import type { OHLCv } from '@/model/type-defs';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export default class ColumnsVolumeSketcher extends AbstractSketcher<OHLCv> {
  public static readonly NAME: string = 'Columns';

  public draw(entry: DataSourceEntry<OHLCv>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    // todo
  }

  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    return undefined;
  }

  public contextmenu(entry: DataSourceEntry): MenuItem[] {
    return [];
  }
}
