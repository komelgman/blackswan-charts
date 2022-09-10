import { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/ContextMenuOptions';
import Viewport from '@/model/viewport/Viewport';

export default class ViewportContextMenu implements ContextMenuOptionsProvider {
  private viewport: Viewport;

  public constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
