/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaneId } from '@/components/layout/PaneDescriptor';
import { clone, DeepPartial, isString, merge } from '@/misc/strict-type-checks';
import DataSourceChangeEventListener, {
  ChangeReasons,
} from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import DataSourceStorage from '@/model/datasource/DataSourceStorage';
import {
  DrawingDescriptor,
  DrawingId,
  DrawingOptions,
  DrawingReference,
} from '@/model/datasource/Drawing';
import DrawingIdHelper from '@/model/datasource/DrawingIdHelper';
import AddNewEntry from '@/model/datasource/incidents/AddNewEntry';
import RemoveEntry from '@/model/datasource/incidents/RemoveEntry';
import UpdateEntry from '@/model/datasource/incidents/UpdateEntry';
import { TVAProtocolOptions } from '@/model/history/TimeVarianceAuthority';
import TVAClerk from '@/model/history/TVAClerk';
import { Predicate } from '@/model/type-defs';
import { isProxy } from 'vue';

export default class DataSource implements Iterable<Readonly<DataSourceEntry>> {
  private readonly storage: DataSourceStorage;
  private readonly reasons: ChangeReasons = new Map();
  private readonly eventListeners: DataSourceChangeEventListener[] = [];
  private drawingIdHelper: DrawingIdHelper;
  private interconnectValue: DataSourceInterconnect | undefined;
  private tvaClerkValue: TVAClerk | undefined;
  private protocolOptions: TVAProtocolOptions | undefined = undefined;

  public constructor(drawings: DrawingOptions[]) {
    this.storage = new DataSourceStorage();
    this.initEntries(drawings);
    this.drawingIdHelper = new DrawingIdHelper(this);
  }

  public set interconnect(value: DataSourceInterconnect) {
    this.interconnectValue = value;
  }

  public get interconnect(): DataSourceInterconnect {
    if (this.interconnectValue === undefined) {
      throw new Error('Illegal State: this.interconnectValue === undefined');
    }

    return this.interconnectValue;
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
      const [descriptor] = entryValue;

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

  * shared(external: PaneId): IterableIterator<Readonly<DataSourceEntry>> {
    this.checkWeAreNotInProxy();

    let entry = this.storage.head;
    while (entry !== undefined) {
      const entryValue: DataSourceEntry = entry.value;
      const [descriptor] = entryValue;
      if (isString(descriptor.ref)
        && descriptor.options.shared
        && (descriptor.options.shareWith === undefined || descriptor.options.shareWith.indexOf(external))
      ) {
        yield entryValue;
      }

      entry = entry.next;
    }
  }

  public attachExternal(paneId: PaneId, entries: IterableIterator<Readonly<DataSourceEntry>>): void {
    const { storage } = this;
    let headRef = storage.head?.value[0].ref;
    for (const entry of entries) {
      if (!headRef) {
        storage.unshift(this.createExternalEntry(paneId, entry));
        headRef = storage.head?.value[0].ref;
      } else {
        storage.insertBefore(headRef, this.createExternalEntry(paneId, entry));
      }
    }
  }

  private createExternalEntry(paneId: PaneId, externalEntry: Readonly<DataSourceEntry>): DataSourceEntry {
    const [externalDescriptor] = externalEntry;
    if (!isString(externalDescriptor.ref)) {
      throw new Error('Illegal argument: external entry cant be shared');
    }

    return [{
      ref: [paneId, externalDescriptor.ref],
      options: externalDescriptor.options,
    }];
  }

  public detachExternal(paneId: PaneId): void {
    let entry = this.storage.head;
    while (entry !== undefined) {
      const [descriptor] = entry.value;
      entry = entry.next;

      if (!isString(descriptor.ref) && descriptor.ref[0] === paneId) {
        this.storage.remove(descriptor.ref);
      }
    }
  }

  public addChangeEventListener(listener: DataSourceChangeEventListener): void {
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

  public beginTransaction(options: TVAProtocolOptions | undefined = undefined): void {
    this.protocolOptions = options || { incident: this.getNewTransactionId() };

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions,
      lifeHooks: {
        afterInverse: () => this.flush(),
        afterApply: () => this.flush(),
      },
    });

    // console.debug('dataSource begin transaction', this.protocolOptions);
  }

  public endTransaction(): void {
    // console.debug('dataSource end transaction', this.protocolOptions);
    this.checkWeAreInTransaction();

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      sign: true,
    });

    this.protocolOptions = undefined;
    this.flush();
  }

  public flush(): void {
    const reasons: ChangeReasons = new Map(this.reasons);
    this.reasons.clear();
    this.fire(reasons);
  }

  public resetCache(): void {
    // console.debug('reset datasource cache');

    const entries: DataSourceEntry[] = [];
    for (const entry of this) {
      entry[0].valid = false;
      entries[entries.length] = entry as DataSourceEntry;
    }

    this.fire(new Map([[DataSourceChangeEventReason.CacheReset, entries]]));
  }

  public invalidated(entries: DataSourceEntry[]): void {
    this.fire(new Map([[DataSourceChangeEventReason.CacheInvalidated, entries]]));
  }

  // todo: tva
  public bringToFront(ref: DrawingReference): void {
    // this.checkWeAreNotInProxy();
    // this.checkWeAreInTransaction();
    //
    // if (!this.has(ref)) {
    //   console.warn(`reference not found: ${ref}`)
    //   return;
    // }
    //
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
  public sendToBack(ref: DrawingReference): void {
    // this.checkWeAreNotInProxy();
    // this.checkWeAreInTransaction();
    //
    // if (!this.has(ref)) {
    //   console.warn(`reference not found: ${ref}`)
    //   return;
    // }
    //
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
  public bringForward(ref: DrawingReference): void {
    // this.checkWeAreNotInProxy();
    // this.checkWeAreInTransaction();
    //
    // if (!this.has(ref)) {
    //   console.warn(`ref not found: ${ref}`)
    //   return;
    // }
    //
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
  public sendBackward(ref: DrawingReference): void {
    // this.checkWeAreNotInProxy();
    // this.checkWeAreInTransaction();
    //
    // if (!this.has(ref)) {
    //   console.warn(`ref not found: ${ref}`)
    //   return;
    // }
    //
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

  public add<T>(options: DrawingOptions<T>): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (this.storage.has(options.id)) {
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

  public update<T>(ref: DrawingReference, value: DeepPartial<DrawingDescriptor<T>>): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      incident: new UpdateEntry({
        entry: this.storage.get(ref),
        update: value,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public clone(entry: DataSourceEntry): DataSourceEntry {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    // todo: detect if it is external then clone by interconnect link
    const cloned: DrawingDescriptor = clone(entry[0]);
    cloned.ref = this.getNewId(cloned.options.type);

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

  public remove(ref: DrawingReference): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    this.tvaClerk.processReport({
      protocolOptions: this.protocolOptions as TVAProtocolOptions,
      incident: new RemoveEntry({
        entry: this.storage.get(ref),
        storage: this.storage,
        addReason: this.addReason.bind(this),
      }),
    });
  }

  public getNewId(type: string): DrawingId {
    return this.drawingIdHelper.getNewId(type);
  }

  private fire(reasons: ChangeReasons): void {
    for (const listener of this.eventListeners) {
      listener.call(listener, reasons, this);
    }
  }

  private initEntries(drawings: DrawingOptions[]): void {
    for (const drawingOptions of drawings) {
      this.storage.push([this.createDescriptor(drawingOptions)]);
    }
  }

  private createDescriptor<T>(options: DrawingOptions<T>): DrawingDescriptor<T> {
    const { id } = options;
    const [descriptor] = merge({ ref: id, options }, { options: { id: null } });
    return descriptor as DrawingDescriptor;
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

  private addReason(reason: DataSourceChangeEventReason, entries: DataSourceEntry[]): void {
    if (this.reasons.has(reason)) {
      const newEntries = [
        ...this.reasons.get(reason) as DataSourceEntry[],
        ...entries,
      ];

      this.reasons.set(reason, newEntries);
    } else {
      this.reasons.set(reason, entries);
    }
  }

  private getNewTransactionId(): string {
    return `--dataSourceTransaction${Math.random()}`; // todo: id generation
  }

  public externalUpdate(ref: DrawingReference): void {
    const entry: DataSourceEntry = this.storage.get(ref);
    entry[0].valid = false;
    this.addReason(DataSourceChangeEventReason.ExternalUpdateEntry, [entry]);
  }
}
