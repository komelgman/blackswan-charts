import { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/ContextMenuOptions';
import TimeAxis from '@/model/axis/TimeAxis';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';

export default class TimeAxisContextMenu implements ContextMenuOptionsProvider {
  private axis: TimeAxis;
  private tva: TimeVarianceAuthority;

  public constructor(tva: TimeVarianceAuthority, axis: TimeAxis) {
    this.tva = tva;
    this.axis = axis;
  }

  public contextmenu(): MenuItem[] {
    return [];
  }
}
