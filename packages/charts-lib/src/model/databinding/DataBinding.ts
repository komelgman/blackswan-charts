import type { Chart } from '@/model/chart/Chart';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceEntry } from '@/model/datasource/types';
import { isString } from '@/model/type-defs';
import type { HasType } from '@/model/type-defs/optional';
import {
  DataSourceChangeEventReason,
  type DataSourceChangeEvent,
  type DataSourceChangeEventListener,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import { filterInPlace } from '@/model/misc/array.filterInPlace';
import type { DataPipe } from '@/model/databinding';
import { retry } from '@/model/misc/function.retry';

export interface ContentOptions<T extends string> extends HasType<T> {}

export interface ExternalContent<O extends ContentOptions<string>, Content> {
  contentOptions?: O;
  content?: Content;
}

export class DataBinding<O extends ContentOptions<string>, Content> {
  private readonly entriesByContentKey: Map<string, [DataSource, DataSourceEntry][]> = new Map();
  private readonly entryRefToContentKey: Map<string, string> = new Map();
  private readonly pipe: DataPipe<O, Content>;
  private readonly removeChartEventListener: Function;

  constructor(chart: Chart, pipe: DataPipe<O, Content>) {
    this.pipe = pipe;

    this.removeChartEventListener = chart.addPaneRegistrationEventListener((e) => {
      if (e.type === 'install') {
        this.bindDataSource(e.pane.model.dataSource);
      } else {
        this.unbindDataSource(e.pane.model.dataSource);
      }
    });

    for (const pane of chart.panes) {
      this.bindDataSource(pane.model.dataSource);
    }
  }

  public unbind(): void {
    this.removeChartEventListener();

    Array.from(this.entriesByContentKey.values())
      .flatMap((entries) => entries.map(([ds, entry]) => {
        entry.descriptor.options.data.content = undefined;
        return ds;
      }))
      .filter((ds, index, array) => array.findIndex((other) => other.id === ds.id) === index)
      .forEach((ds) => this.unbindDataSource(ds));
  }

  private bindDataSource(dataSource: DataSource): void {
    dataSource.addChangeEventListener(this.dataSourceEventListener, { immediate: true });
  }

  private unbindDataSource(dataSource: DataSource): void {
    dataSource.removeChangeEventListener(this.dataSourceEventListener);

    for (const entry of dataSource) {
      this.unbindEntry(dataSource, entry);
    }
  }

  private dataSourceEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap, ds: DataSource): void => {
    const newEntries = this.getApplicableEventEntries(events.get(DataSourceChangeEventReason.AddEntry) || []);
    for (const entry of newEntries) {
      this.tryBindEntry(ds, entry);
    }

    const removedEntries = this.getApplicableEventEntries(events.get(DataSourceChangeEventReason.RemoveEntry) || []);
    for (const entry of removedEntries) {
      this.unbindEntry(ds, entry);
    }

    const updatedEntries = this.getApplicableEventEntries([
      ...(events.get(DataSourceChangeEventReason.UpdateEntry) || []),
      ...(events.get(DataSourceChangeEventReason.DataInvalid) || []),
    ]);
    for (const entry of updatedEntries) {
      this.tryUpdateEntryContentOptions(ds, entry);
    }
  };

  private tryUpdateEntryContentOptions(ds: DataSource, entry: DataSourceEntry) {
    if (!isString(entry.descriptor.ref)) {
      return;
    }

    const prevContentKey = this.entryRefToContentKey.get(this.toEntryRef(ds, entry));
    const curContentOptions = this.pipe.getContentOptions(entry);
    if (!curContentOptions) {
      if (prevContentKey) {
        this.unbindEntryByContentKey(ds, entry, prevContentKey);
      }

      return;
    }

    const curContentKey = this.pipe.toContentKey(curContentOptions);
    if (prevContentKey !== curContentKey) {
      if (prevContentKey) {
        this.unbindEntryByContentKey(ds, entry, prevContentKey);
      }

      this.tryBindEntry(ds, entry);
    } else {
      const contentOptionsCollection: O[] = (this.entriesByContentKey.get(curContentKey) || [])
        .map(([, e]) => e.descriptor.options.data.contentOptions);

      this.pipe.updateSubscription(contentOptionsCollection);
    }
  }

  private tryBindEntry(ds: DataSource, entry: DataSourceEntry) {
    if (!isString(entry.descriptor.ref)) {
      return;
    }

    const contentOptions = this.pipe.getContentOptions(entry);
    if (!contentOptions) {
      return;
    }

    const contentKey = this.pipe.toContentKey(contentOptions);
    let startLoading = false;
    if (!this.entriesByContentKey.has(contentKey)) {
      this.entriesByContentKey.set(contentKey, []);
      startLoading = true;
    }

    this.entriesByContentKey.get(contentKey)?.push([ds, entry]);
    this.entryRefToContentKey.set(this.toEntryRef(ds, entry), contentKey);

    if (startLoading) {
      this.pipe.subscribe(contentOptions, this.updateContentWithRetry.bind(this));
    } else {
      this.updateContentWithRetry(contentKey, this.pipe.getContent(contentKey));
    }
  }

  private updateContentWithRetry(contentKey: string, content: Content) {
    const retries = 5;
    const retryOptions = {
      retries,
      factor: 2,
      minTimeout: 10,
      maxTimeout: 500,
    };

    retry(retryOptions, async () => this.updateContent(contentKey, content))
      .catch((error) => {
        console.error(`Failed to update content with key ${contentKey} after ${retries} retries:`, error);
      });
  }

  private updateContent(contentKey: string, content: Content) {
    const shouldBeUpdated = this.entriesByContentKey.get(contentKey) || [];

    for (const [ds, entry] of shouldBeUpdated) {
      ds.noHistoryManagedEntriesProcess(
        [entry.descriptor.ref],
        (e: DataSourceEntry<any>) => { e.descriptor.options.data.content = content; },
      );
    }
  }

  private unbindEntry(ds: DataSource, entry: DataSourceEntry): void {
    if (!isString(entry.descriptor.ref)) {
      return;
    }

    this.deleteFromEntryRefToContentOptions(ds, entry);

    const contentOptions = this.pipe.getContentOptions(entry);
    if (!contentOptions) {
      return;
    }

    const contentKey = this.pipe.toContentKey(contentOptions);
    this.deleteFromEntriesByContentKey(contentKey, ds, entry);
  }

  private unbindEntryByContentKey(ds: DataSource, entry: DataSourceEntry, contentKey: string): void {
    if (!isString(entry.descriptor.ref)) {
      return;
    }

    this.deleteFromEntryRefToContentOptions(ds, entry);
    this.deleteFromEntriesByContentKey(contentKey, ds, entry);
  }

  private deleteFromEntryRefToContentOptions(ds: DataSource, entry: DataSourceEntry): void {
    this.entryRefToContentKey.delete(this.toEntryRef(ds, entry));
  }

  private deleteFromEntriesByContentKey(contentKey: string, ds: DataSource, entry: DataSourceEntry): void {
    const storedEntries = this.entriesByContentKey.get(contentKey);
    if (!storedEntries) {
      return;
    }

    filterInPlace(storedEntries, ([storedDs, storedEntry]) => storedDs.id !== ds.id || storedEntry.descriptor.ref !== entry.descriptor.ref);

    if (storedEntries.length === 0) {
      this.entriesByContentKey.delete(contentKey);
      this.pipe.unsubscribe(contentKey);
    }
  }

  private toEntryRef(dataSource: DataSource, entry: DataSourceEntry): string {
    return `${dataSource.id}#${entry.descriptor.ref}`;
  }

  private getApplicableEventEntries(events: DataSourceChangeEvent[]): DataSourceEntry[] {
    return events
      .filter((event) => !event.shared)
      .map((event) => event.entry);
  }
}
