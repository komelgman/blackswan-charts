import { computed, watch } from 'vue';
import type { DataSourceChangeEventListener, DataSourceChangeEventsMap } from '@/model/datasource/DataSourceChangeEventListener';
import Layer from '@/components/layered-canvas/layers/Layer';
import type { InvertedValue } from '@/model/axis/PriceAxis';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type Viewport from '@/model/viewport/Viewport';

export default class ViewportHighlightingLayer extends Layer {
  private readonly viewport: Viewport;

  constructor(viewport: Viewport) {
    super();

    this.viewport = viewport;

    watch([
      computed(() => this.viewport.priceAxis.inverted),
      computed(() => this.viewport.highlighted),
      computed(() => this.viewport.selected),
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

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const { highlighted, selected } = this.viewport;
    if (highlighted === undefined && selected.size === 0) {
      return;
    }

    const inverted: InvertedValue = this.viewport.priceAxis.inverted.value;
    if (inverted < 0) {
      native.translate(width / 2, height / 2);
      native.rotate(Math.PI);
      native.scale(-1, 1);
      native.translate(-width / 2, -height / 2);
    }

    for (const entry of selected) {
      this.highlight(entry, native);
    }

    if (highlighted !== undefined && !selected.has(highlighted)) {
      this.highlight(highlighted, native);
    }
  }

  private highlight(entry: DataSourceEntry, native: CanvasRenderingContext2D): void {
    const { descriptor, drawing } = entry;

    if (descriptor.options.visible && descriptor.visibleInViewport && drawing !== undefined) {
      for (const part of drawing.parts) {
        part.render(native);
      }

      for (const [, handle] of Object.entries(drawing.handles)) {
        handle.render(native);
      }
    }
  }
}
