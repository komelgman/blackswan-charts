/* eslint-disable @typescript-eslint/no-explicit-any */
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import { Predicate } from '@/model/type-defs';
import { clone, DeepPartial } from '@/misc/strict-type-checks';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { DrawingId, DrawingOptions, DrawingType } from '@/model/datasource/Drawing';
import { isProxy } from 'vue';
import DrawingIdHelper from '@/model/datasource/DrawingIdHelper';
import Sketcher from '@/model/sketchers/Sketcher';
import Viewport from '@/model/viewport/Viewport';
import TimeVarianceAuthority, { TVAProtocolOptions } from '@/model/history/TimeVarianceAuthority';
import TVAProtocol from '@/model/history/TVAProtocol';
import UpdateDrawing from '@/model/datasource/incidents/UpdateDrawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import AddNewDrawing from '@/model/datasource/incidents/AddNewDrawing';
import RemoveDrawing from '@/model/datasource/incidents/RemoveDrawing';

export default class DataSource implements Iterable<Readonly<DataSourceEntry>> {
  private readonly data: DataSourceEntry[];
  private readonly reasons: Set<DataSourceChangeEventReason> = new Set();
  private readonly eventListeners: DataSourceChangeEventListener[] = [];
  private drawingIdHelper: DrawingIdHelper;
  private protocolOptions: TVAProtocolOptions | undefined = undefined;
  public tva: TimeVarianceAuthority | undefined;

  public constructor(drawingOptions: DrawingOptions[]) {
    this.data = this.convertToDataArray(drawingOptions);
    this.drawingIdHelper = new DrawingIdHelper(this);
  }

  * [Symbol.iterator](): IterableIterator<Readonly<DataSourceEntry>> {
    this.checkWeAreNotInProxy();

    for (const value of this.data) yield value;
  }

  * visible(inverse: boolean = false): IterableIterator<Readonly<DataSourceEntry>> {
    this.checkWeAreNotInProxy();

    if (inverse) {
      for (let i = this.data.length - 1; i >= 0; i -= 1) {
        const value: DataSourceEntry = this.data[i];
        const opt = value[0];
        if (opt.visible && opt.visibleInViewport && opt.valid) {
          yield value;
        }
      }
    } else {
      for (const value of this.data) {
        const opt = value[0];
        if (opt.visible && opt.visibleInViewport && opt.valid) {
          yield value;
        }
      }
    }
  }

  * filtered(predicate: Predicate<DataSourceEntry>): IterableIterator<Readonly<DataSourceEntry>> {
    this.checkWeAreNotInProxy();

    for (const value of this.data) {
      if (predicate(value)) {
        yield value;
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
    if (this.tva === undefined) {
      throw new Error('Illegal state: this.tva === undefined');
    }

    this.protocolOptions = options || { incident: this.getNewTransactionId() };
    this.protocol.setLifeHooks({
      afterInverse: () => this.flush(),
      afterApply: () => this.flush(),
    });

    // console.debug('dataSource begin transaction', this.protocolOptions);
  }

  private get protocol(): TVAProtocol {
    if (this.tva === undefined || this.protocolOptions === undefined) {
      throw new Error('Illegal state: this.tva === undefined || this.protocolOptions === undefined');
    }

    return this.tva.getProtocol(this.protocolOptions);
  }

  public endTransaction(): void {
    // console.debug('dataSource end transaction', this.protocolOptions);

    if (this.protocol === undefined) {
      throw new Error('Illegal state: this.protocol === undefined');
    }

    this.protocol.trySign();
    this.protocolOptions = undefined;
  }

  public flush(): void {
    const reasons: Set<DataSourceChangeEventReason> = new Set(this.reasons);
    this.reasons.clear();
    this.fire(reasons);
  }

  public resetCache(): void {
    // console.debug('reset datasource cache');

    for (const [options] of this.data) {
      options.valid = false;
    }

    this.fire(DataSourceChangeEventReason.CacheReset);
  }

  public invalidateCache(viewport: Viewport): void {
    // console.debug('invalidate datasource cache');

    const invalidEntries = ([options]: DataSourceEntry): boolean => options.visible && !options.valid;
    for (const entry of this.filtered(invalidEntries)) {
      const drawingType: DrawingType = entry[0].type;
      if (!viewport.hasSketcher(drawingType)) {
        console.warn(`unknown drawing type ${drawingType}`);
        continue;
      }

      const sketcher: Sketcher = viewport.getSketcher(drawingType) as Sketcher;
      sketcher.draw(entry as DataSourceEntry, viewport);
    }

    this.fire(DataSourceChangeEventReason.CacheInvalidated);
  }

  // todo: tva
  public bringToFront(id: DrawingId): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (!this.has(id)) {
      console.warn(`id not found: ${id}`)
      return;
    }
    this.addReason(DataSourceChangeEventReason.OrderChanged);

    const index: number = this.indexById(id);
    const { data } = this;

    const tmp = data[index];
    data.splice(index, 1);
    data.push(tmp);
  }

  // todo: tva
  public sendToBack(id: DrawingId): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (!this.has(id)) {
      console.warn(`id not found: ${id}`)
      return;
    }

    const index: number = this.indexById(id);
    if (index === 0) {
      console.warn('index === 0')
      return;
    }

    this.addReason(DataSourceChangeEventReason.OrderChanged);

    const { data } = this;
    const tmp = data[index];
    data.splice(index, 1);
    data.unshift(tmp);
  }

  // todo: tva
  public bringForward(id: DrawingId): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (!this.has(id)) {
      console.warn(`id not found: ${id}`)
      return;
    }

    const index: number = this.indexById(id);
    const { data } = this;
    if (index >= data.length - 1) {
      console.warn('index >= order.length - 1')
      return;
    }

    this.addReason(DataSourceChangeEventReason.OrderChanged);

    const tmp = data[index];
    data[index] = data[index + 1];
    data.splice(index + 1, 1, tmp);
  }

  // todo: tva
  public sendBackward(id: DrawingId): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (!this.has(id)) {
      console.warn(`id not found: ${id}`)
      return;
    }

    const index: number = this.indexById(id);
    if (index === 0) {
      console.warn('index === 0')
      return;
    }

    this.addReason(DataSourceChangeEventReason.OrderChanged);

    const { data } = this;
    const tmp = data[index];
    data[index] = data[index - 1];
    data.splice(index - 1, 1, tmp);
  }

  public get(id: DrawingId): DataSourceEntry {
    const index = this.indexById(id)
    if (index < 0) {
      throw new Error(`Unknown drawingId: ${id}`);
    }

    return this.data[index];
  }

  public add<T>(options: DrawingOptions<T>): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (this.has(options.id)) {
      throw new Error(`Entry with this Id already exists: ${options.id}`);
    }

    this.protocol.addIncident(new AddNewDrawing({
      addReason: this.addReason.bind(this),
      drawingOptions: options,
      dataSourceEntries: this.data,
    }));
  }

  public update<T>(id: DrawingId, value: DeepPartial<DrawingOptions<T>>): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    const index = this.indexById(id);
    if (index < 0) {
      throw new Error(`try update: Entry with Id wasn't found: ${id}`);
    } else {
      const [options] = this.data[index];
      this.protocol.addIncident(new UpdateDrawing({
        addReason: this.addReason.bind(this),
        drawingOptions: options,
        update: value,
      }));
    }
  }

  public clone(id: DrawingId): DataSourceEntry {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    const entry = this.get(id);
    if (entry === undefined) {
      throw new Error(`Entry width Id wasn't found: ${id}`);
    }

    const options: DrawingOptions = clone(entry[0]);
    options.id = this.getNewId(options.type);

    this.protocol.addIncident(new AddNewDrawing({
      addReason: this.addReason.bind(this),
      drawingOptions: options,
      dataSourceEntries: this.data,
    }));

    return this.get(options.id);
  }

  public remove(id: DrawingId): void {
    this.checkWeAreNotInProxy();
    this.checkWeAreInTransaction();

    if (!this.has(id)) {
      console.warn(`id not found: ${id}`)
      return;
    }

    this.addReason(DataSourceChangeEventReason.RemoveEntry);

    this.protocol.addIncident(new RemoveDrawing({
      index: this.indexById(id),
      addReason: this.addReason.bind(this),
      dataSourceEntries: this.data,
    }));
  }

  public has(id: DrawingId): boolean {
    return this.data.findIndex((value) => value[0].id === id) >= 0;
  }

  public getNewId(type: string): DrawingId {
    return this.drawingIdHelper.getNewId(type);
  }

  private fire(value: Set<DataSourceChangeEventReason> | DataSourceChangeEventReason): void {
    const reasons: Set<DataSourceChangeEventReason> = (value as Set<DataSourceChangeEventReason>).forEach === undefined
      ? new Set<DataSourceChangeEventReason>([value as DataSourceChangeEventReason])
      : value as Set<DataSourceChangeEventReason>;

    for (const listener of this.eventListeners) {
      listener.call(listener, reasons);
    }
  }

  private convertToDataArray(drawingOptions: DrawingOptions[]): DataSourceEntry[] {
    return drawingOptions.map((value) => [value]);
  }

  private checkWeAreNotInProxy(): void {
    if (isProxy(this)) {
      throw new Error('Invalid state, dataSource shouldn\'t be reactive');
    }
  }

  private checkWeAreInTransaction(): void {
    if (!this.protocol) {
      throw new Error('Invalid state, dataSource.beginTransaction() should be used before');
    }
  }

  private addReason(reason: DataSourceChangeEventReason): void {
    this.reasons.add(reason);
  }

  private indexById(id: DrawingId): number {
    const result: number = this.data.findIndex((value) => value[0].id === id);

    if (result === -1) {
      throw new Error(`id wasn't found: ${id}`)
    }

    return result;
  }

  private getNewTransactionId(): string {
    return `--dataSourceTransaction${Math.random()}`;
  }
}
