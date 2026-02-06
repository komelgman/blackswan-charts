import type { PaneDescriptor } from '@blackswan/layout/model';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface TogglePaneOptions extends HistoricalIncidentOptions {
  panes: PaneDescriptor<Viewport>[];
  paneIndex: number;
}

export default class TogglePane extends AbstractHistoricalIncident<TogglePaneOptions> {
  protected applyIncident(): void {
    const { panes, paneIndex } = this.options;
    const targetPane = panes[paneIndex];

    // undefined === true by  default
    const isVisible: boolean = targetPane.visible || targetPane.visible === undefined;
    if (isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  protected inverseIncident(): void {
    this.applyIncident();
  }

  private show(): void {
    const { panes, paneIndex } = this.options;
    const targetPane = panes[paneIndex];

    targetPane.visible = true;
  }

  private hide(): void {
    const { panes, paneIndex } = this.options;
    const targetPane = panes[paneIndex];

    targetPane.visible = false;
  }
}
