import Layer from '@/components/layered-canvas/layers/Layer';
import { InvertedValue } from '@/model/axis/PriceAxis';
import DataSourceChangeEventListener, {
  ChangeReasons,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import Viewport from '@/model/viewport/Viewport';
import { computed, watch } from 'vue';

export default class ViewportHighlightingLayer extends Layer {
  private readonly viewport: Viewport;

  constructor(viewport: Viewport) {
    super();

    this.viewport = viewport;

    watch([
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

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: ChangeReasons): void => {
    if (reasons.has(DataSourceChangeEventReason.CacheInvalidated)) {
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
      this.highlight(entry, native, inverted);
    }

    if (highlighted !== undefined && !selected.has(highlighted)) {
      this.highlight(highlighted, native, inverted);
    }
  }

  private highlight(entry: DataSourceEntry, native: CanvasRenderingContext2D, inverted: InvertedValue): void {
    const [descriptor, drawing] = entry;

    if (descriptor.options.visible && descriptor.visibleInViewport && drawing !== undefined) {
      for (const part of drawing.parts) {
        part.render(native, inverted);
      }

      for (const [, handle] of Object.entries(drawing.handles)) {
        handle.render(native, inverted);
      }
    }
  }
}
