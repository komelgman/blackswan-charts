import Viewport from '@/model/viewport/Viewport';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import { computed, toRaw, watch, WatchStopHandle } from 'vue';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';

export default class DataSourceInvalidator {
  private readonly viewportModel: Viewport;
  private contextValue!: LayerContext;
  private unwatch!: WatchStopHandle;

  constructor(viewportModel: Viewport) {
    this.viewportModel = viewportModel;
  }

  public set context(value: LayerContext) {
    this.contextValue = value;
  }

  public get context(): LayerContext {
    return this.contextValue;
  }

  public installListeners(): void {
    const { dataSource } = this.viewportModel;
    dataSource.addChangeEventListener(this.dataSourceChangeEventListener);

    const { priceAxis, timeAxis } = this.viewportModel;
    this.unwatch = watch([
      priceAxis.scale,
      priceAxis.range,
      computed(() => priceAxis.screenSize.main),
      timeAxis.range,
      computed(() => timeAxis.screenSize.main),
    ], this.resetDataSourceCache.bind(this), { immediate: true });
  }

  public uninstallListeners(): void {
    if (this.unwatch) {
      this.unwatch();
    }

    const { dataSource } = this.viewportModel;
    dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: Set<DataSourceChangeEventReason>): void => {
    if (reasons.has(DataSourceChangeEventReason.CacheReset)
      || reasons.has(DataSourceChangeEventReason.AddEntry)
      || reasons.has(DataSourceChangeEventReason.RemoveEntry)
      || reasons.has(DataSourceChangeEventReason.UpdateEntry)) {
      this.invalidate();
    }
  };

  public invalidate(): void {
    if (this.context === undefined) {
      return;
    }

    const dataSource = toRaw(this.viewportModel.dataSource);
    dataSource.invalidateCache(this.viewportModel);
  }

  public resetDataSourceCache(): void {
    toRaw(this.viewportModel.dataSource).resetCache();
  }
}
