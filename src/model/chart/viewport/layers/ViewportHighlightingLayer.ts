import { computed, watch, type WatchStopHandle } from 'vue';
import type { InvertedValue } from '@/model/chart/axis/PriceAxis';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry } from '@/model/datasource/types';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { CanvasRenderingContext, LayerContext } from '@/components/layered-canvas/types';
import { DirectRenderLayer } from '@/components/layered-canvas/model/DirectRenderLayer';
import ViewportHighlightInvalidator from '@/model/chart/viewport/ViewportHighlightInvalidator';

export default class ViewportHighlightingLayer extends DirectRenderLayer {
  private readonly viewport: Viewport;
  private readonly highlightInvalidator: ViewportHighlightInvalidator;
  private readonly dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  constructor(viewport: Viewport) {
    super();

    this.viewport = viewport;
    this.highlightInvalidator = viewport.highlightInvalidator;
  }

  public updateContext(ctx: LayerContext): void {
    this.highlightInvalidator.layerContext = ctx;
    super.updateContext(ctx);
  }

  public init(): void {
    super.init();
    this.installListeners();
  }

  protected installWatcher(): WatchStopHandle {
    const { viewport } = this;
    return watch([
      computed(() => viewport.priceAxis.inverted),
      computed(() => viewport.highlighted),
      computed(() => viewport.selected),
    ], () => {
      this.invalid = true;
    }, { deep: true });
  }

  public destroy(): void {
    this.uninstallListeners();
    super.destroy();
  }

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

  private installListeners(): void {
    this.viewport.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  private uninstallListeners(): void {
    this.viewport.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }
}
