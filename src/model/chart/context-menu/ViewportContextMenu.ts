import type { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';

export default class ViewportContextMenu implements ContextMenuOptionsProvider {
  private viewport: Viewport;

  public constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
