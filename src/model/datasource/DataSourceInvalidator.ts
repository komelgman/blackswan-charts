import type { LayerContext } from '@/components/layered-canvas/types';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import type Viewport from '@/model/chart/viewport/Viewport';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { DataSourceEntry, DrawingType } from '@/model/datasource/types';
import type { WatchStopHandle } from 'vue';
import { computed, toRaw, watch } from 'vue';

export default class DataSourceInvalidator {
  private contextValue!: LayerContext;
  private readonly viewport: Viewport;
  private unwatch!: WatchStopHandle;
  private invalid?: DataSourceEntry[];

  constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  public get context(): LayerContext {
    return this.contextValue;
  }

  public set context(value: LayerContext) {
    this.contextValue = value;
    if (this.invalid !== undefined) {
      this.invalidate(this.invalid);
      this.invalid = undefined;
    }
  }

  public installListeners(): void {
    const { dataSource } = this.viewport;
    dataSource.addChangeEventListener(this.dataSourceChangeEventListener);

    const { priceAxis, timeAxis } = this.viewport;
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

    const { dataSource } = this.viewport;
    dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const entries: Set<DataSourceEntry> = new Set([
      ...((events.get(DataSourceChangeEventReason.CacheReset) || []).map((e) => (e.entry))),
      ...((events.get(DataSourceChangeEventReason.AddEntry) || []).map((e) => (e.entry))),
      ...((events.get(DataSourceChangeEventReason.UpdateEntry) || []).map((e) => (e.entry))),
    ]);

    if (entries.size) {
      this.invalidate(Array.from(entries.values()));
    }
  };

  private invalidate(entries: DataSourceEntry[]): void {
    if (this.context === undefined) {
      this.invalid = entries;
      return;
    }

    const invalidated: DataSourceEntry[] = [];

    for (const entry of entries) {
      if (entry.descriptor.valid) {
        console.warn(`Entry ${entry.descriptor.ref} already valid`);
        continue;
      }

      const drawingType: DrawingType = entry.descriptor.options.type;
      if (!this.viewport.hasSketcher(drawingType)) {
        console.warn(`unknown drawing type ${drawingType}`);
        continue;
      }

      const sketcher: Sketcher = this.viewport.getSketcher(drawingType);
      if (sketcher.invalidate(entry, this.viewport)) {
        invalidated.push(entry);
      }
    }

    toRaw(this.viewport.dataSource).invalidated(invalidated);
  }

  private resetDataSourceCache(): void {
    toRaw(this.viewport.dataSource).resetCache();
  }
}
