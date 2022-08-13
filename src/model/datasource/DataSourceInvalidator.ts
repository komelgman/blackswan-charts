import Viewport from '@/model/viewport/Viewport';
import LayerContext from '@/components/layered-canvas/layers/LayerContext';
import { computed, toRaw, watch } from 'vue';
import { DataSourceEntry } from '@/model/datasource/DataSource';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import Sketcher from '@/model/datasource/Sketcher';
import { DrawingType } from '@/model/datasource/Drawing';

export default class DataSourceInvalidator {
  private readonly viewportModel: Viewport;
  private contextValue!: LayerContext;
  private sketchers: Map<DrawingType, Sketcher>;

  constructor(viewportModel: Viewport, sketchers: Map<DrawingType, Sketcher>) {
    this.viewportModel = viewportModel;
    this.sketchers = sketchers;

    const { priceAxis, timeAxis } = this.viewportModel;
    watch([
      priceAxis.scale,
      priceAxis.range,
      computed(() => priceAxis.screenSize.main),
      timeAxis.range,
      computed(() => timeAxis.screenSize.main),
    ], this.cleanDataSourceCache.bind(this));
  }

  public set context(value: LayerContext) {
    this.contextValue = value;
    this.cleanDataSourceCache();
  }

  public get context(): LayerContext {
    return this.contextValue;
  }

  public installListeners(): void {
    const { dataSource } = this.viewportModel;
    dataSource.addChangeEventListener(this.listener.bind(this));
  }

  public uninstallListeners(): void {
    const { dataSource } = this.viewportModel;
    dataSource.removeChangeEventListener(this.listener.bind(this));
  }

  private listener: DataSourceChangeEventListener = (reasons: Set<DataSourceChangeEventReason>): void => {
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

    const invalidEntries = ([options]: DataSourceEntry): boolean => options.visible && !options.valid;
    const dataSource = toRaw(this.viewportModel.dataSource);
    dataSource.startTransaction();
    for (const entry of dataSource.filtered(invalidEntries)) {
      const drawingType: DrawingType = entry[0].type;
      if (!this.sketchers.has(drawingType)) {
        // console.warn(`unknown drawing type ${drawingType}`);
        continue;
      }

      const sketcher: Sketcher = this.sketchers.get(drawingType) as Sketcher;
      sketcher.draw(entry as DataSourceEntry, this.viewportModel);
    }

    dataSource.endTransaction(DataSourceChangeEventReason.CacheInvalidated);
  }

  public cleanDataSourceCache(): void {
    const dataSource = toRaw(this.viewportModel.dataSource);
    dataSource.startTransaction();
    dataSource.cleanCache();
    dataSource.endTransaction();
  }
}
