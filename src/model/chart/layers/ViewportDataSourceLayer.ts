import Layer from '@/components/layered-canvas/model/Layer';
import type { Inverted, InvertedValue } from '@/model/chart/axis/PriceAxis';
import type DataSource from '@/model/datasource/DataSource';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import { toRaw, watch } from 'vue';

export default class ViewportDataSourceLayer extends Layer {
  private readonly ds: DataSource;
  private readonly inverted: Inverted;

  constructor(ds: DataSource, priceAxisIsInverted: Inverted) {
    super();

    this.ds = ds;
    this.inverted = priceAxisIsInverted;

    watch([this.inverted], () => {
      this.invalid = true;
    });
  }

  public installListeners(): void {
    this.ds.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  public uninstallListeners(): void {
    this.ds.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const inverted: InvertedValue = this.inverted.value;
    if (inverted < 0) {
      native.translate(width / 2, height / 2);
      native.rotate(Math.PI);
      native.scale(-1, 1);
      native.translate(-width / 2, -height / 2);
    }

    for (const { drawing } of toRaw(this.ds).visible()) {
      if (drawing === undefined) {
        throw new Error('drawing === undefined');
      }

      const { parts } = drawing;
      for (const graphics of parts) {
        graphics.render(this.ctx.native);
      }
    }
  }
}
