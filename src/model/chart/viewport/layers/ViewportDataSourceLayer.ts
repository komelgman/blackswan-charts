import { watch } from 'vue';
import type { Inverted, InvertedValue } from '@/model/chart/axis/PriceAxis';
import type DataSource from '@/model/datasource/DataSource';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import { DirectRenderLayer } from '@/components/layered-canvas/model/DirectRenderLayer';

export default class ViewportDataSourceLayer extends DirectRenderLayer {
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

  protected doRender(): void {
    const inverted: InvertedValue = this.inverted.value;
    const { height, width } = this.context;
    const { renderingContext } = this;

    if (!renderingContext) {
      return;
    }

    if (inverted < 0) {
      renderingContext.translate(width / 2, height / 2);
      renderingContext.rotate(Math.PI);
      renderingContext.scale(-1, 1);
      renderingContext.translate(-width / 2, -height / 2);
    }

    for (const { drawing } of this.ds.visible()) {
      if (drawing === undefined) {
        throw new Error('drawing === undefined');
      }

      const { parts } = drawing;
      for (const graphics of parts) {
        graphics.render(renderingContext);
      }
    }
  }
}
