import { clone, merge, isString, type DeepPartial, type Predicate, type IdHelper, NonReactive } from '@blackswan/foundation';
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
import type { HistoricalProtocolOptions, HistoricalTransactionManager } from '@/model/history';

@NonReactive
export default class DataSource implements Iterable<Readonly<DataSourceEntry>> {
  public readonly id: DataSourceId;
  public readonly sharedEntries: DataSourceSharedEntries;

  private readonly storage: DataSourceEntriesStorage;
  private readonly changeEvents: DataSourceChangeEventsMap = new Map();
  private readonly eventListeners: DataSourceChangeEventListener[] = [];
  private readonly idHelper: IdHelper;
  private historicalTransactionManager: HistoricalTransactionManager | undefined;

  public constructor(options: DataSourceOptions, drawings: DrawingOptions[] = []) {
    this.id = options.id ? options.id : options.idHelper.getNewId('datasource');
    this.storage = new DataSourceEntriesStorage();
    this.idHelper = options.idHelper;
    this.sharedEntries = new DataSourceSharedEntries(this, this.storage, this.addReason);

    this.initEntries(drawings);
  }

  public reset(): void {
    Array.from(this)
      .filter((entry) => isString(entry.descriptor.ref))
      .forEach((entry) => this.remove(entry.descriptor.ref as string));

    this.idHelper.forGroup(this.id).reset();
  }

  public set transactionManager(value: HistoricalTransactionManager) {
    this.historicalTransactionManager = value;
  }

  public get transactionManager(): HistoricalTransactionManager {
    if (this.historicalTransactionManager === undefined) {
      throw new Error('Illegal state: this.historicalTransactionManager === undefined');
    }

    return this.historicalTransactionManager;
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

  public addChangeEventListener(listener: DataSourceChangeEventListener, options?: { immediate?: boolean }): Function {
    const index = this.eventListeners.findIndex((v) => v === listener);
    if (index > -1) {
      console.error('Event listener already exists');
      return () => this.removeChangeEventListener(listener);
    }

    this.eventListeners.push(listener);

    if (options?.immediate) {
      const events = this.toChangeEvents(DataSourceChangeEventReason.AddEntry, [...this[Symbol.iterator]()]);
      const eventsMap: DataSourceChangeEventsMap = new Map();
      eventsMap.set(DataSourceChangeEventReason.AddEntry, events);
      listener.call(listener, eventsMap, this);
    }

    return () => this.removeChangeEventListener(listener);
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
    this.transactionManager.openTransaction(options);
    this.transactionManager.exeucteInTransaction({
      lifeHooks: {
        afterInverse: () => this.flush(),
        afterApply: () => this.flush(),
      },
    });
  }

  public endTransaction(): void {
    this.transactionManager.tryCloseTransaction();
    this.flush();
  }

  public get<T>(ref: DrawingReference): DataSourceEntry<T> {
    if (!isString(ref) && ref[0] === this.id) {
      return this.storage.get(ref[1]);
    }

    return this.storage.get(ref);
  }

  public add<T>(options: DrawingOptions<T>): void {
    if (options.id !== undefined && this.storage.has(options.id)) {
      throw new Error(`Entry with this reference already exists: ${options.id}`);
    }

    this.transactionManager.exeucteInTransaction({
      incident: new AddNewEntry({
        descriptor: this.createDescriptor(options),
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public update<T>(ref: DrawingReference, value: DeepPartial<Omit<DrawingOptions<T>, 'id'>>): void {
    this.transactionManager.exeucteInTransaction({
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
    this.transactionManager.exeucteInTransaction({
      incident: new RemoveEntry({
        ref,
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public clone(entry: DataSourceEntry): DataSourceEntry {
    const cloned: DrawingDescriptor = clone(entry.descriptor);
    if (isString(cloned.ref)) {
      cloned.ref = this.getNewId(cloned.options.type);
    } else {
      cloned.ref[1] = this.idHelper.forGroup(cloned.ref[0]).getNewId(cloned.options.type);
    }

    this.transactionManager.exeucteInTransaction({
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

    return merge({ ref: id, options: clone(options) })[0] as DrawingDescriptor;
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

  private fire(events: DataSourceChangeEventsMap): void {
    for (const listener of this.eventListeners) {
      listener.call(listener, events, this);
    }
  }
}
