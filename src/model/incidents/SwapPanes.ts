import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import { PaneDescriptor } from '@/components/layout';
import Viewport from '@/model/viewport/Viewport';

export interface SwapPanesOptions extends HistoricalIncidentOptions {
  pane1Index: number;
  pane2Index: number;
  panes: PaneDescriptor<Viewport>[];
}

export default class SwapPanes extends AbstractHistoricalIncident<SwapPanesOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: SwapPanesOptions) {
    super(options);
  }

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
