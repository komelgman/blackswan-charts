import type { PaneDescriptor } from '@/components/layout/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface SwapPanesOptions extends HistoricalIncidentOptions {
  pane1Index: number;
  pane2Index: number;
  panes: PaneDescriptor<Viewport>[];
}

export default class SwapPanes extends AbstractHistoricalIncident<SwapPanesOptions> {
  protected applyIncident(): void {
    const { panes, pane1Index, pane2Index } = this.options;
    const tmp: PaneDescriptor<Viewport> = panes[pane1Index];
    panes[pane1Index] = panes[pane2Index];

    // trigger change
    panes.splice(pane2Index, 1, tmp);
  }

  protected inverseIncident(): void {
    this.applyIncident();
  }
}
