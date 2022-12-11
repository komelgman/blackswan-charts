import { PaneDescriptor } from '@/components/layout';
import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import Viewport from '@/model/viewport/Viewport';

export interface TogglePaneOptions extends HistoricalIncidentOptions {
  panes: PaneDescriptor<Viewport>[];
  paneIndex: number;
}

export default class TogglePane extends AbstractHistoricalIncident<TogglePaneOptions> {
  private panesSizes: number[] = [];
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

  private show(): void {
    const { panes, paneIndex } = this.options;
    const targetPane = panes[paneIndex];

    targetPane.visible = true;
    for (const pane of panes) {
      pane.actualSize = this.panesSizes.shift();
    }
  }

  private hide(): void {
    const { panes, paneIndex } = this.options;
    const targetPane = panes[paneIndex];

    this.panesSizes = [];
    for (const pane of panes) {
      this.panesSizes.push(pane.actualSize || 0);
    }

    targetPane.visible = false;
    targetPane.actualSize = undefined;
  }

  protected inverseIncident(): void {
    this.apply();
  }
}
