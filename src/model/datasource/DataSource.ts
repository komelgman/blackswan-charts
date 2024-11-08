import { clone } from '@/misc/object.clone';
import { merge } from '@/misc/object.merge';
import { type DeepPartial, type Predicate, type Wrapped, isString } from '@/model/type-defs';
import { NonReactive } from '@/model/type-defs/decorators';
import DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import DataSourceSharedEntries from '@/model/datasource/DataSourceSharedEntries';
import {
  type DataSourceChangeEvent,
  type DataSourceChangeEventListener,
  DataSourceChangeEventReason,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import { AddNewEntry, RemoveEntry, UpdateEntry } from '@/model/datasource/incidents';
import type {
  DataSourceEntry,
  DataSourceId,
  DataSourceOptions,
  DrawingDescriptor,
  DrawingId,
  DrawingOptions,
  DrawingReference,
} from '@/model/datasource/types';
import type { HistoricalIncidentReportProcessor, HistoricalProtocolOptions } from '@/model/history';
import type IdHelper from '@/model/tools/IdHelper';
import { SetPrimaryResource } from '@/model/datasource/incidents/SetPrimaryResource';

@NonReactive
export default class DataSource implements Iterable<Readonly<DataSourceEntry>> {
  public readonly id: DataSourceId;
  public readonly sharedEntries: DataSourceSharedEntries;

  private readonly storage: DataSourceEntriesStorage;
  private readonly changeEvents: DataSourceChangeEventsMap = new Map();
  private readonly eventListeners: DataSourceChangeEventListener[] = [];
  private readonly idHelper: IdHelper;
  private historicalIncidentReportProcessorValue: HistoricalIncidentReportProcessor | undefined;
  private protocolOptions: HistoricalProtocolOptions | undefined = undefined;
  private primaryResourceRefValue: Wrapped<DrawingReference | undefined> = { value: undefined };

  public constructor(options: DataSourceOptions, drawings: DrawingOptions[] = []) {
    this.id = options.id ? options.id : options.idHelper.getNewId('datasource');
    this.storage = new DataSourceEntriesStorage();
    this.idHelper = options.idHelper;
    this.sharedEntries = new DataSourceSharedEntries(this, this.storage, this.addReason);

    this.initEntries(drawings);
  }

  public reset(): void {
    this.beginTransaction();
    Array.from(this)
      .filter((entry) => isString(entry.descriptor.ref))
      .forEach((entry) => this.remove(entry.descriptor.ref as string));
    this.endTransaction();

    this.idHelper.forGroup(this.id).reset();
  }

  public set historicalIncidentReportProcessor(value: HistoricalIncidentReportProcessor) {
    this.historicalIncidentReportProcessorValue = value;
  }

  public get historicalIncidentReportProcessor(): HistoricalIncidentReportProcessor {
    if (this.historicalIncidentReportProcessorValue === undefined) {
      throw new Error('Illegal state: this.historicalIncidentReportProcessorValue === undefined');
    }

    return this.historicalIncidentReportProcessorValue;
  }

  * [Symbol.iterator](): IterableIterator<Readonly<DataSourceEntry>> {
    let entry = this.storage.head;
    while (entry !== undefined) {
      yield entry.value;
      entry = entry.next;
    }
  }

  * visible(inverse: boolean = false): IterableIterator<Readonly<DataSourceEntry>> {
    const it = inverse ? 'prev' : 'next';
    let entry = inverse ? this.storage.tail : this.storage.head;
    while (entry !== undefined) {
      const entryValue: DataSourceEntry = entry.value;
      const { descriptor } = entryValue;

      if (descriptor.visibleInViewport && descriptor.options.visible) {
        yield entryValue;
      }

      entry = entry[it];
    }
  }

  * filtered(predicate: Predicate<DataSourceEntry>): IterableIterator<Readonly<DataSourceEntry>> {
    let entry = this.storage.head;
    while (entry !== undefined) {
      const entryValue: DataSourceEntry = entry.value;
      if (predicate(entryValue)) {
        yield entryValue;
      }

      entry = entry.next;
    }
  }

  public addChangeEventListener(listener: DataSourceChangeEventListener): void {
    const index = this.eventListeners.findIndex((v) => v === listener);
    if (index > -1) {
      console.error('Event listener already exists');
      return;
    }

    this.eventListeners.push(listener);
  }

  public removeChangeEventListener(listener: DataSourceChangeEventListener): void {
    const index = this.eventListeners.findIndex((v) => v === listener);
    if (index < 0) {
      console.error('Event listener not found');
      return;
    }

    this.eventListeners.splice(index, 1);
  }

  public resetCache(): void {
    const entries: DataSourceEntry[] = [];
    for (const entry of this) {
      entry.descriptor.valid = false;
      entries[entries.length] = entry as DataSourceEntry;
    }

    const { CacheReset } = DataSourceChangeEventReason;
    this.fire(new Map([[CacheReset, this.toChangeEvents(CacheReset, entries)]]));
  }

  public invalidated(entries: DataSourceEntry[]): void {
    const { CacheInvalidated } = DataSourceChangeEventReason;
    this.fire(new Map([[CacheInvalidated, this.toChangeEvents(CacheInvalidated, entries)]]));
  }

  public beginTransaction(options: HistoricalProtocolOptions | undefined = undefined): void {
    this.protocolOptions = options ?? { protocolTitle: this.getNewTransactionId() };

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions,
      lifeHooks: {
        afterInverse: () => this.flush(),
        afterApply: () => this.flush(),
      },
    });
  }

  public endTransaction(): void {
    this.checkWeAreInTransaction();

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions as HistoricalProtocolOptions,
      sign: true,
    });

    this.protocolOptions = undefined;
    this.flush();
  }

  public get primaryResourceRef(): DrawingReference | undefined {
    return this.primaryResourceRefValue.value;
  }

  public set primaryResourceRef(value: DrawingReference | undefined) {
    this.checkWeAreInTransaction();

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions as HistoricalProtocolOptions,
      incident: new SetPrimaryResource({
        value,
        target: this.primaryResourceRefValue,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public get<T>(ref: DrawingReference): DataSourceEntry<T> {
    if (!isString(ref) && ref[0] === this.id) {
      return this.storage.get(ref[1]);
    }

    return this.storage.get(ref);
  }

  public add<T>(options: DrawingOptions<T>): void {
    this.checkWeAreInTransaction();

    if (options.id !== undefined && this.storage.has(options.id)) {
      throw new Error(`Entry with this reference already exists: ${options.id}`);
    }

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions as HistoricalProtocolOptions,
      incident: new AddNewEntry({
        descriptor: this.createDescriptor(options),
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public update<T>(ref: DrawingReference, value: DeepPartial<Omit<DrawingOptions<T>, 'id'>>): void {
    this.checkWeAreInTransaction();

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions as HistoricalProtocolOptions,
      incident: new UpdateEntry({
        ref,
        storage: this.storage,
        update: value,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public noHistoryManagedEntriesProcess<T>(
    refs: DrawingReference[],
    processor: (entry: DataSourceEntry<T>) => void,
    reason: DataSourceChangeEventReason = DataSourceChangeEventReason.UpdateEntry,
  ): void {
    const entries: DataSourceEntry[] = [];

    for (const ref of refs) {
      const entry: DataSourceEntry<T> = this.storage.get(ref);
      processor(entry);
      entry.descriptor.valid = false;
      entries.push(entry);
    }

    this.addReason(reason, entries);
    this.flush();
  }

  public remove(ref: DrawingReference): void {
    this.checkWeAreInTransaction();

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions as HistoricalProtocolOptions,
      incident: new RemoveEntry({
        ref,
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public clone(entry: DataSourceEntry): DataSourceEntry {
    this.checkWeAreInTransaction();

    const cloned: DrawingDescriptor = clone(entry.descriptor);
    if (isString(cloned.ref)) {
      cloned.ref = this.getNewId(cloned.options.type);
    } else {
      cloned.ref[1] = this.idHelper.forGroup(cloned.ref[0]).getNewId(cloned.options.type);
    }

    this.historicalIncidentReportProcessor({
      protocolOptions: this.protocolOptions as HistoricalProtocolOptions,
      incident: new AddNewEntry({
        descriptor: cloned,
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });

    return this.storage.get(cloned.ref);
  }

  // todo: add to history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public bringToFront(ref: DrawingReference): void {
    this.checkWeAreInTransaction();

    // const index: number = this.indexByRef(ref);
    // const { orderedEntries } = this;
    //
    // const tmp = orderedEntries[index];
    // orderedEntries.splice(index, 1);
    // orderedEntries.push(tmp);
    //
    // this.addReason(DataSourceChangeEventReason.OrderChanged, orderedEntries);
  }

  // todo: add to history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendToBack(ref: DrawingReference): void {
    this.checkWeAreInTransaction();

    // const index: number = this.indexByRef(ref);
    // if (index === 0) {
    //   console.warn('index === 0')
    //   return;
    // }
    //
    // const { orderedEntries } = this;
    // const tmp = orderedEntries[index];
    // orderedEntries.splice(index, 1);
    // orderedEntries.unshift(tmp);
    //
    // this.addReason(DataSourceChangeEventReason.OrderChanged, orderedEntries);
  }

  // todo: add to history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public bringForward(ref: DrawingReference): void {
    this.checkWeAreInTransaction();

    // const index: number = this.indexByRef(ref);
    // const { orderedEntries } = this;
    // if (index >= orderedEntries.length - 1) {
    //   console.warn('index >= order.length - 1')
    //   return;
    // }
    //
    // const tmp = orderedEntries[index];
    // orderedEntries[index] = orderedEntries[index + 1];
    // orderedEntries.splice(index + 1, 1, tmp);
    //
    // this.addReason(DataSourceChangeEventReason.OrderChanged, orderedEntries);
  }

  // todo: add to history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendBackward(ref: DrawingReference): void {
    this.checkWeAreInTransaction();

    // const index: number = this.indexByRef(ref);
    // if (index === 0) {
    //   console.warn('index === 0')
    //   return;
    // }
    //
    // const { orderedEntries } = this;
    // const tmp = orderedEntries[index];
    // orderedEntries[index] = orderedEntries[index - 1];
    // orderedEntries.splice(index - 1, 1, tmp);
    //
    // this.addReason(DataSourceChangeEventReason.OrderChanged, orderedEntries);
  }

  public flush(): void {
    const events: DataSourceChangeEventsMap = new Map(this.changeEvents);
    this.changeEvents.clear();
    this.fire(events);
  }

  public getNewId(type: string): DrawingId {
    return this.idHelper.forGroup(this.id).getNewId(type);
  }

  private initEntries(drawings: DrawingOptions[]): void {
    for (const drawingOptions of drawings) {
      this.storage.push({ descriptor: this.createDescriptor(drawingOptions) });
    }
  }

  private createDescriptor<T>(options: DrawingOptions<T>): DrawingDescriptor<T> {
    const { id, type } = options;
    if (isString(id)) {
      this.idHelper
        .forGroup(this.id)
        .update(type, this.getNumberFromId(type, id));
    }

    return merge({ ref: id, options: { ...options } }, { options: { id: null } })[0] as DrawingDescriptor;
  }

  private getNumberFromId(type: string, id: DrawingId): number {
    const regex = new RegExp(`${type}(\\d+)`, 'i');
    const matches = regex.exec(id);

    if (matches == null || matches.length > 2) {
      throw new Error(`Unsupported DrawingId template, use 'drawing.type + Number'. 
      Drawing with type '${type}' found incorrect id '${id}'`);
    }

    return Number.parseInt(matches[1], 10);
  }

  private checkWeAreInTransaction(): void {
    if (!this.protocolOptions) {
      throw new Error('Invalid state, dataSource.beginTransaction() should be used before');
    }
  }

  private addReason(reason: DataSourceChangeEventReason, entries: DataSourceEntry[], shared: boolean = false): void {
    const changeEvents: DataSourceChangeEvent[] = this.toChangeEvents(reason, entries, shared);
    if (this.changeEvents.has(reason)) {
      (this.changeEvents.get(reason) as DataSourceChangeEvent[]).push(...changeEvents);
    } else {
      this.changeEvents.set(reason, changeEvents);
    }
  }

  private toChangeEvents(reason: DataSourceChangeEventReason, entries: DataSourceEntry[], shared: boolean = false): DataSourceChangeEvent[] {
    return entries.map((entry) => ({ entry, reason, shared }));
  }

  private getNewTransactionId(): string {
    return this.idHelper.getNewId(`datasource-${this.id}-transaction-`);
  }

  private fire(events: DataSourceChangeEventsMap): void {
    for (const listener of this.eventListeners) {
      listener.call(listener, events, this);
    }
  }
}
