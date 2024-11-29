import { computed, watch } from 'vue';
import type { InvertedValue } from '@/model/chart/axis/PriceAxis';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry } from '@/model/datasource/types';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { CanvasRenderingContext } from '@/components/layered-canvas/types';
import { DirectRenderLayer } from '@/components/layered-canvas/model/DirectRenderLayer';

export default class ViewportHighlightingLayer extends DirectRenderLayer {
  private readonly viewport: Viewport;

  constructor(viewport: Viewport) {
    super();

    this.viewport = viewport;

    watch([
      computed(() => viewport.priceAxis.inverted),
      computed(() => viewport.highlighted),
      computed(() => viewport.selected),
    ], () => {
      this.invalid = true;
    }, { deep: true });
  }

  public installListeners(): void {
    this.viewport.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  public uninstallListeners(): void {
    this.viewport.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }
  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  protected doRender(): void {
    const { highlighted, selected } = this.viewport;
    if (highlighted === undefined && selected.size === 0) {
      return;
    }

    const { height, width } = this.context;
    const { renderingContext } = this;

    if (!renderingContext) {
      return;
    }

    const inverted: InvertedValue = this.viewport.priceAxis.inverted.value;
    if (inverted < 0) {
      renderingContext.translate(width / 2, height / 2);
      renderingContext.rotate(Math.PI);
      renderingContext.scale(-1, 1);
      renderingContext.translate(-width / 2, -height / 2);
    }

    for (const entry of selected) {
      this.highlight(entry, renderingContext);
    }

    if (highlighted !== undefined && !selected.has(highlighted)) {
      this.highlight(highlighted, renderingContext);
    }
  }

  private highlight(entry: DataSourceEntry, renderingContext: CanvasRenderingContext): void {
    const { descriptor, drawing } = entry;

    if (descriptor.options.visible && descriptor.visibleInViewport && drawing !== undefined) {
      for (const part of drawing.parts) {
        part.render(renderingContext);
      }

      for (const [, handle] of Object.entries(drawing.handles)) {
        handle.render(renderingContext);
      }
    }
  }
}
