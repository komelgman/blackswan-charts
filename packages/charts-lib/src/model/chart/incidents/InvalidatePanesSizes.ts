import type { PaneDescriptor } from '@/components/layout/types';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface InvalidatePanesSizesOptions extends HistoricalIncidentOptions {
  panes: PaneDescriptor<unknown>[],
  initial: Record<string, number>;
  changed: Record<string, number>;
}

export default class InvalidatePanesSizes extends AbstractHistoricalIncident<InvalidatePanesSizesOptions> {
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
