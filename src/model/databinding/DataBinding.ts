import { toRaw } from 'vue';
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
import { filterInPlace } from '@/misc/array.filterInPlace';
import { clone } from '@/misc/object.clone';

export interface ContentOptions<T extends string> extends HasType<T> {}

export interface ExternalContent<O extends ContentOptions<string>, ContentType> {
  contentOptions?: O;
  content?: ContentType;
}

export interface DataPipe<O extends ContentOptions<string>, ContentType> {
  contentOptions(entry: DataSourceEntry): O | undefined;
  canHandle(contentOptions: O): boolean;
  toContentKey(contentOptions: O): string;
  startContentLoading(contentOptions: O, contentUpdateCallback: (contentKey: string, content: ContentType) => void): void;
  tryUpdateLoaderOptions(oldContentOptions: O, newContentOptions: O): void;
  stopContentLoading(contentKey: string): void;
  getContent(contentKey: string): ContentType;
}

export class DataBinding<O extends ContentOptions<string>, ContentType> {
  private readonly entriesByContentKey: Map<string, [DataSource, DataSourceEntry][]> = new Map();
  private readonly entryRefToContentOptions: Map<string, O> = new Map();
  private readonly pipe: DataPipe<O, ContentType>;

  constructor(chart: Chart, pipe: DataPipe<O, ContentType>) {
    this.pipe = pipe;

    chart.addPaneRegistrationEventListener((e) => {
      if (e.type === 'install') {
        this.bindDataSource(toRaw(e.pane.model.dataSource));
      } else {
        this.unbindDataSource(toRaw(e.pane.model.dataSource));
      }
    });

    for (const pane of chart.panes) {
      this.bindDataSource(toRaw(pane.model.dataSource));
    }
  }

  private bindDataSource(dataSource: DataSource): void {
    for (const entry of dataSource) {
      this.tryBindEntry(dataSource, entry);
    }

    dataSource.addChangeEventListener(this.dataSourceEventListener);
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

    const updatedEntries = this.getApplicableEventEntries(events.get(DataSourceChangeEventReason.UpdateEntry) || []);
    for (const entry of updatedEntries) {
      this.tryUpdateEntryContentOptions(ds, entry);
    }
  };

  private tryUpdateEntryContentOptions(ds: DataSource, entry: DataSourceEntry) {
    if (!isString(entry.descriptor.ref)) {
      return;
    }

    const prevContentOptions = this.entryRefToContentOptions.get(this.toEntryRef(ds, entry));
    if (!prevContentOptions) {
      return;
    }

    const prevContentKey = this.pipe.toContentKey(prevContentOptions);
    const curContentOptions = this.pipe.contentOptions(entry);
    if (!curContentOptions || !this.pipe.canHandle(curContentOptions)) {
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
      this.pipe.tryUpdateLoaderOptions(prevContentOptions, curContentOptions);
    }
  }

  private tryBindEntry(ds: DataSource, entry: DataSourceEntry) {
    if (!isString(entry.descriptor.ref)) {
      return;
    }

    const contentOptions = this.pipe.contentOptions(entry);
    if (!contentOptions || !this.pipe.canHandle(contentOptions)) {
      return;
    }

    const contentKey = this.pipe.toContentKey(contentOptions);
    let startLoading = false;
    if (!this.entriesByContentKey.has(contentKey)) {
      this.entriesByContentKey.set(contentKey, []);
      startLoading = true;
    }

    this.entriesByContentKey.get(contentKey)?.push([ds, entry]);
    this.entryRefToContentOptions.set(this.toEntryRef(ds, entry), clone(contentOptions));

    if (startLoading) {
      this.pipe.startContentLoading(contentOptions, this.updateContent.bind(this));
    } else {
      this.updateContent(contentKey, this.pipe.getContent(contentKey));
    }
  }

  private updateContent(contentKey: string, content: ContentType) {
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

    const contentOptions = this.pipe.contentOptions(entry);
    if (!contentOptions || !this.pipe.canHandle(contentOptions)) {
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
    this.entryRefToContentOptions.delete(this.toEntryRef(ds, entry));
  }

  private deleteFromEntriesByContentKey(contentKey: string, ds: DataSource, entry: DataSourceEntry): void {
    const storedEntries = this.entriesByContentKey.get(contentKey);
    if (!storedEntries) {
      return;
    }

    filterInPlace(storedEntries, ([storedDs, storedEntry]) => storedDs.id !== ds.id || storedEntry.descriptor.ref !== entry.descriptor.ref);

    if (storedEntries.length === 0) {
      this.pipe.stopContentLoading(contentKey);
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
