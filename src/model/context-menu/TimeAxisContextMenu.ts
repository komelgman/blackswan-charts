import type { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type TimeAxis from '@/model/axis/TimeAxis';

export default class TimeAxisContextMenu implements ContextMenuOptionsProvider {
  private axis: TimeAxis;

  public constructor(axis: TimeAxis) {
    this.axis = axis;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
