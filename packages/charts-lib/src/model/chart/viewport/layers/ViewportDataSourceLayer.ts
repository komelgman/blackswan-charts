import { watch, type WatchStopHandle } from 'vue';
import type { Inverted } from '@/model/chart/axis/PriceAxis';
import type DataSource from '@/model/datasource/DataSource';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import { DirectRenderLayer } from '@blackswan/layered-canvas/model';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import DataSourceInvalidator from '@/model/datasource/DataSourceInvalidator';
import type { LayerContext } from '@blackswan/layered-canvas/model';

export default class ViewportDataSourceLayer extends DirectRenderLayer {
  private readonly dataSource: DataSource;
  private readonly inverted: Inverted;
  private readonly dataSourceInvalidator: DataSourceInvalidator;
  private readonly dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  constructor(viewport: Viewport) {
    super();

    const { dataSource, priceAxis } = viewport;

    this.dataSource = dataSource;
    this.inverted = priceAxis.inverted;
    this.dataSourceInvalidator = new DataSourceInvalidator(viewport);
  }

  public updateContext(ctx: LayerContext): void {
    this.dataSourceInvalidator.context = ctx;
    super.updateContext(ctx);
  }

  public init(): void {
    super.init();
    this.installListeners();
  }

  protected installWatcher(): WatchStopHandle {
    return watch([this.inverted], () => {
      this.invalid = true;
    });
  }

  public destroy(): void {
    this.uninsatllListeners();
    super.destroy();
  }

  protected doRender(): void {
    const { renderingContext } = this;

    if (!renderingContext) {
      return;
    }

    for (const { drawing } of this.dataSource.visible()) {
      if (drawing === undefined) {
        throw new Error('drawing === undefined');
      }

      const { parts } = drawing;
      for (const graphics of parts) {
        graphics.render(renderingContext);
      }
    }
  }

  private installListeners() {
    this.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
    this.dataSourceInvalidator.installListeners();
  }

  private uninsatllListeners() {
    this.dataSourceInvalidator.uninstallListeners();
    this.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }
}
