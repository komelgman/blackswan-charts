import type { ContextMenuOptionsProvider, MenuItem } from '@blackswan/context-menu/types';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

export class TimeAxisContextMenu implements ContextMenuOptionsProvider {
  private axis: TimeAxis;

  public constructor(axis: TimeAxis) {
    this.axis = axis;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
