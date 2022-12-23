import type { PaneDescriptor } from '@/components/layout';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import type Viewport from '@/model/viewport/Viewport';

export interface TogglePaneOptions extends HistoricalIncidentOptions {
  panes: PaneDescriptor<Viewport>[];
  paneIndex: number;
}

export default class TogglePane extends AbstractHistoricalIncident<TogglePaneOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: TogglePaneOptions) {
    super(options);
  }

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
