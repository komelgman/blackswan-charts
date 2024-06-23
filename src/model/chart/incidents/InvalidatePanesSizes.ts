import type { PaneDescriptor } from '@/components/layout/types';

import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';

export interface InvalidatePanesSizesOptions extends HistoricalIncidentOptions {
  panes: PaneDescriptor<unknown>[],
  initial: Record<string, number>;
  changed: Record<string, number>;
}

export default class InvalidatePanesSizes extends AbstractHistoricalIncident<InvalidatePanesSizesOptions> {
  // eslint-disable-next-line no-useless-constructor
  public constructor(options: InvalidatePanesSizesOptions) {
    super(options);
  }

  protected applyIncident(): void {
    const { changed } = this.options;
    this.setPanesSizes(changed);
  }

  protected inverseIncident(): void {
    const { initial } = this.options;
    this.setPanesSizes(initial);
  }

  private setPanesSizes(sizes: Record<string, number>): void {
    const { panes } = this.options;

    for (const pane of panes) {
      pane.size = sizes[pane.id];
    }
  }
}
