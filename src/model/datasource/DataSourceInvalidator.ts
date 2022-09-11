import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import DataSourceChangeEventListener, {
  ChangeReasons,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { DrawingType } from '@/model/datasource/Drawing';
import Sketcher from '@/model/sketchers/Sketcher';
import Viewport from '@/model/viewport/Viewport';
import { computed, toRaw, watch, WatchStopHandle } from 'vue';

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

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (reasons: ChangeReasons): void => {
    const entries: DataSourceEntry[] = [
      ...(reasons.get(DataSourceChangeEventReason.CacheReset) || []),
      ...(reasons.get(DataSourceChangeEventReason.AddEntry) || []),
      ...(reasons.get(DataSourceChangeEventReason.UpdateEntry) || []),
      ...(reasons.get(DataSourceChangeEventReason.ExternalUpdateEntry) || []),
    ];

    if (entries.length || reasons.has(DataSourceChangeEventReason.RemoveEntry)) {
      this.invalidate(entries);
      toRaw(this.viewportModel.dataSource).invalidated(entries);
    }
  };

  private invalidate(entries: DataSourceEntry[]): void {
    if (this.context === undefined) {
      return;
    }

    for (const entry of entries) {
      if (entry[0].valid) {
        console.warn(`Invalid state: entry ${entry[0].ref} already valid`);
        continue;
      }

      const drawingType: DrawingType = entry[0].options.type;
      if (!this.viewportModel.hasSketcher(drawingType)) {
        console.warn(`unknown drawing type ${drawingType}`);
        continue;
      }

      const sketcher: Sketcher = this.viewportModel.getSketcher(drawingType) as Sketcher;
      sketcher.draw(entry, this.viewportModel);
    }
  }

  private resetDataSourceCache(): void {
    toRaw(this.viewportModel.dataSource).resetCache();
  }
}
