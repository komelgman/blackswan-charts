import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import { PaneDescriptor } from '@/components/layout';
import Viewport from '@/model/viewport/Viewport';

export interface TogglePaneOptions extends HistoricalIncidentOptions {
  paneDescriptor: PaneDescriptor<Viewport>;
}

export default class TogglePane extends AbstractHistoricalIncident<TogglePaneOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: TogglePaneOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { paneDescriptor } = this.options;
    // undefined === true by  default
    paneDescriptor.visible = !(paneDescriptor.visible || paneDescriptor.visible === undefined);
  }

  protected inverseIncident(): void {
    this.apply();
  }
}
