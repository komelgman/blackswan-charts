import type { PaneDescriptor } from '@/components/layout';
import type { PaneSize, PanesSizeChangeEvent } from '@/components/layout/PanesSizeChangedEvent';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import type { CanMergeWith } from '@/model/type-defs/options/CanMergeWith';

export interface PanesSizeChangedOptions extends HistoricalIncidentOptions {
  event: PanesSizeChangeEvent
}

export default class PanesSizeChanged
  extends AbstractHistoricalIncident<PanesSizeChangedOptions>
  implements CanMergeWith<PanesSizeChanged> {
  //---------------------------------------------------------------
  protected readonly marker: string = '--pane-size-changed';

  // eslint-disable-next-line no-useless-constructor
  public constructor(options: PanesSizeChangedOptions) {
    super(options);
  }

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
