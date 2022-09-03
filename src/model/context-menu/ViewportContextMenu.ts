import { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/ContextMenuOptions';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import Viewport from '@/model/viewport/Viewport';

export default class ViewportContextMenu implements ContextMenuOptionsProvider {
  private viewport: Viewport;
  private tva: TimeVarianceAuthority;

  public constructor(tva: TimeVarianceAuthority, viewport: Viewport) {
    this.tva = tva;
    this.viewport = viewport;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
