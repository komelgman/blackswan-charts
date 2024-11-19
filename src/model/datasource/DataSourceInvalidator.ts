import type { WatchStopHandle } from 'vue';
import { computed, toRaw, watch } from 'vue';
import type { LayerContext } from '@/components/layered-canvas/types';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import {
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { DataSourceEntry, DrawingType } from '@/model/datasource/types';

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

  private async invalidate(entries: DataSourceEntry[]): Promise<void> {
    if (this.context === undefined) {
      this.invalid = entries;
      return;
    }

    const viewport = toRaw(this.viewport);

    const invalidatedPromises = entries.map(async (entry) => {
      const { valid, ref, options } = entry.descriptor;
      if (valid) {
        console.warn(`Entry ${ref} already valid`);
        return null;
      }

      const drawingType: DrawingType = options.type;
      const sketcher: Sketcher = viewport.getSketcher(drawingType);
      if (!sketcher) {
        console.warn(`unknown drawing type ${drawingType}`);
        return null;
      }

      const isInvalidated = await sketcher.invalidate(entry, viewport);
      return isInvalidated ? entry : null;
    });

    const invalidatedEntries = (await Promise.all(invalidatedPromises)).filter((e) => e !== null);

    viewport.dataSource.invalidated(invalidatedEntries);
  }

  private resetDataSourceCache(): void {
    this.viewport.dataSource.resetCache();
  }
}
