import type { ContextMenuOptionsProvider, MenuItem } from '@blackswan/context-menu/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';

export class ViewportContextMenu implements ContextMenuOptionsProvider {
  private viewport: Viewport;

  public constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
