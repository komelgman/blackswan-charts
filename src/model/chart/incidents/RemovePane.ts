import type { PaneDescriptor } from '@/components/layout';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import type Viewport from '@/model/chart/viewport/Viewport';

export interface RemovePaneOptions extends HistoricalIncidentOptions {
  paneIndex: number;
  panes: PaneDescriptor<Viewport>[];
}

export default class RemovePane extends AbstractHistoricalIncident<RemovePaneOptions> {
  private paneDescriptor!: PaneDescriptor<Viewport>;

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: RemovePaneOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { panes, paneIndex } = this.options;
    [this.paneDescriptor] = panes.splice(paneIndex, 1);
  }

  protected inverseIncident(): void {
    const { panes, paneIndex } = this.options;
    panes.splice(paneIndex, 0, this.paneDescriptor);
  }
}
