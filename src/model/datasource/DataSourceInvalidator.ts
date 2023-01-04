import type { WatchStopHandle } from 'vue';
import { computed, toRaw, watch } from 'vue';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import type { DataSourceChangeEventsMap } from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingType } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/sketchers/Sketcher';
import type Viewport from '@/model/viewport/Viewport';

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

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const entries: DataSourceEntry[] = [
      ...((events.get(DataSourceChangeEventReason.CacheReset) || []).map((e) => (e.entry))),
      ...((events.get(DataSourceChangeEventReason.AddEntry) || []).map((e) => (e.entry))),
      ...((events.get(DataSourceChangeEventReason.UpdateEntry) || []).map((e) => (e.entry))),
    ];

    if (entries.length) {
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
