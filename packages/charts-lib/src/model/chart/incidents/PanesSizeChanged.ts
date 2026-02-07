import type { HasMergeWith } from '@blackswan/foundation';
import type { PaneDescriptor, PaneSize, PanesSizeChangedEvent } from '@blackswan/layout/model';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface PanesSizeChangedOptions extends HistoricalIncidentOptions {
  event: PanesSizeChangedEvent
}

export default class PanesSizeChanged
  extends AbstractHistoricalIncident<PanesSizeChangedOptions>
  implements HasMergeWith<PanesSizeChanged> {
  //---------------------------------------------------------------
  protected readonly marker: string = '--pane-size-changed';

  protected applyIncident(): void {
    const { changed } = this.options.event;
    this.setPanesSizes(changed);
  }

  protected inverseIncident(): void {
    const { initial } = this.options.event;
    this.setPanesSizes(initial);
  }

  private setPanesSizes(sizes: PaneSize[]): void {
    const { source: multipane } = this.options.event;
    const panes: PaneDescriptor<any>[] = multipane.visibleItems;

    if (panes.length !== sizes.length) {
      throw new Error('panes.length !== sizes.length');
    }

    for (let i = 0; i < panes.length; i += 1) {
      panes[i].preferredSize = sizes[i].preferred;
      panes[i].size = sizes[i].current;
    }

    multipane.invalidate();
  }

  public mergeWith(op: PanesSizeChanged): boolean {
    if (op.marker !== this.marker) {
      return false;
    }

    this.options.event.changed = op.options.event.changed;

    return true;
  }
}
