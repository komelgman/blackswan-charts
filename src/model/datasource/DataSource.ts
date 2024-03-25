import type { DeepPartial } from '@/misc/strict-type-checks';
import { clone, isString, merge } from '@/misc/strict-type-checks';
import type {
  DataSourceChangeEvent,
  DataSourceChangeEventListener,
  DataSourceChangeEventsMap,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import DataSourceEntriesStorage from '@/model/datasource/DataSourceEntriesStorage';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import DataSourceSharedEntriesProcessor from '@/model/datasource/DataSourceSharedEntriesProcessor';
import type { DrawingDescriptor, DrawingId, DrawingOptions, DrawingReference } from '@/model/datasource/Drawing';
import AddNewEntry from '@/model/datasource/incidents/AddNewEntry';
import RemoveEntry from '@/model/datasource/incidents/RemoveEntry';
import UpdateEntry from '@/model/datasource/incidents/UpdateEntry';
import type { TVAProtocolOptions } from '@/model/history/TimeVarianceAuthority';
import type TVAClerk from '@/model/history/TVAClerk';
import type { EntityId } from '@/model/tools/IdBuilder';
import type IdHelper from '@/model/tools/IdHelper';
import type { Predicate } from '@/model/type-defs';
import { isProxy, toRaw } from 'vue';

export declare type DataSourceId = EntityId;
export interface DataSourceOptions {
  id?: DataSourceId;
  idHelper: IdHelper
}

export default class DataSource implements Iterable<Readonly<DataSourceEntry>> {
  public readonly id: DataSourceId;
  public readonly sharedEntriesProcessor: DataSourceSharedEntriesProcessor;
  private readonly storage: DataSourceEntriesStorage;
  private readonly changeEvents: DataSourceChangeEventsMap = new Map();
  private readonly eventListeners: DataSourceChangeEventListener[] = [];
  private readonly idHelper: IdHelper;
  private tvaClerkValue: TVAClerk | undefined;
  private protocolOptions: TVAProtocolOptions | undefined = undefined;

  public constructor(options: DataSourceOptions, drawings: DrawingOptions[]) {
    this.id = options.id ? options.id : options.idHelper.getNewId('datasource');
    this.storage = new DataSourceEntriesStorage();
    this.idHelper = options.idHelper;
    this.sharedEntriesProcessor = new DataSourceSharedEntriesProcessor(this, this.storage, this.addReason);

    this.initEntries(drawings);
  }

  public set tvaClerk(value: TVAClerk) {
    this.tvaClerkValue = value;
  }

  public get tvaClerk(): TVAClerk {
    if (this.tvaClerkValue === undefined) {
      throw new Error('Illegal state: this.tvaValue === undefined');
    }

    return this.tvaClerkValue;
  }

  * [Symbol.iterator](): IterableIterator<Readonly<DataSourceEntry>> {
    this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      yield entry.value;
      entry = entry.next;
    }
  }

  * visible(inverse: boolean = false): IterableIterator<Readonly<DataSourceEntry>> {
    this.checkWeAreNotInProxy();

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
    this.checkWeAreNotInProxy();

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

  public beginTransaction(options: TVAProtocolOptions | undefined = undefined): void {
    this.protocolOptions = options ?? { incident: this.getNewTransactionId() };

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions,
      lifeHooks: {
        afterInverse: () => toRaw(this).flush(),
        afterApply: () => toRaw(this).flush(),
      },
    });
  }

  public endTransaction(): void {
    this.checkWeAreInTransaction();

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      sign: true,
    });

    this.protocolOptions = undefined;
    this.flush();
  }

  public get<T>(ref: DrawingReference): DataSourceEntry<T> {
    if (!isString(ref) && ref[0] === this.id) {
      return this.storage.get(ref[1]);
    }

    return this.storage.get(ref);
  }

  public add<T>(options: DrawingOptions<T>): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (options.id !== undefined && this.storage.has(options.id)) {
      throw new Error(`Entry with this reference already exists: ${options.id}`);
    }

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      incident: new AddNewEntry({
        descriptor: this.createDescriptor(options),
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public update<T>(ref: DrawingReference, value: DeepPartial<Omit<DrawingOptions<T>, 'id'>>): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      incident: new UpdateEntry({
        ref,
        storage: this.storage,
        update: value,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public process<T>(refs: DrawingReference[], processor: (entry: DataSourceEntry<T>) => void): void {
    this.checkWeAreNotInProxy();
    const entries: DataSourceEntry[] = [];

    for (const ref of refs) {
      const entry: DataSourceEntry<T> = this.storage.get(ref);
      processor(entry);
      entry.descriptor.valid = false;
      entries.push(entry);
    }

    this.addReason(DataSourceChangeEventReason.UpdateEntry, entries);
    this.flush();
  }

  public remove(ref: DrawingReference): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      incident: new RemoveEntry({
        ref,
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public clone(entry: DataSourceEntry): DataSourceEntry {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    const cloned: DrawingDescriptor = clone(entry.descriptor);
    if (isString(cloned.ref)) {
      cloned.ref = this.getNewId(cloned.options.type);
    } else {
      cloned.ref[1] = this.idHelper.forGroup(cloned.ref[0]).getNewId(cloned.options.type);
    }

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      incident: new AddNewEntry({
        descriptor: cloned,
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });

    return this.storage.get(cloned.ref);
  }

  // todo: tva
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public bringToFront(ref: DrawingReference): void {
    this.checkWeAreNotInProxy();
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

  // todo: tva
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendToBack(ref: DrawingReference): void {
    this.checkWeAreNotInProxy();
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

  // todo: tva
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public bringForward(ref: DrawingReference): void {
    this.checkWeAreNotInProxy();
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

  // todo: tva
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendBackward(ref: DrawingReference): void {
    this.checkWeAreNotInProxy();
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

  private checkWeAreNotInProxy(): void {
    if (isProxy(this)) {
      throw new Error('Invalid state, dataSource shouldn\'t be reactive');
    }
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
    return entries.map((entry) => ({ entry: toRaw(entry), reason, shared }));
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
