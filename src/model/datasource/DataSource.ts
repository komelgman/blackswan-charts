/* eslint-disable @typescript-eslint/no-explicit-any */
import type DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import { Predicate, Processor } from '@/model/type-defs';
import { DeepPartial, merge } from '@/misc/strict-type-checks';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import Drawing, { AxisMark, DrawingId, DrawingOptions } from '@/model/datasource/Drawing';
import { isProxy } from 'vue';

export declare type DataSourceEntry<DataType = any> = [DrawingOptions<DataType>, Drawing?, AxisMark?];
export declare type DataSourceUpdateTask = {
  predicate?: Predicate<DataSourceEntry>,
  inverse?: boolean,
  processor: Processor<DataSourceEntry>,
}

export default class DataSource implements Iterable<Readonly<DataSourceEntry>> {
  public static readonly GENERIC_ALL_DRAWING_ID: string = '---generic---all';
  private readonly data: DataSourceEntry[];
  private readonly reasons: Set<DataSourceChangeEventReason> = new Set();
  private readonly eventListeners: DataSourceChangeEventListener[] = [];
  private transaction: number = 0;

  public constructor(drawingOptions: DrawingOptions[]) {
    this.data = this.convertToDataArray(drawingOptions);
  }

  private convertToDataArray(drawingOptions: DrawingOptions[]): DataSourceEntry[] {
    return drawingOptions.map((value) => [value]);
  }

  * [Symbol.iterator](): IterableIterator<Readonly<DataSourceEntry>> {
    if (isProxy(this)) {
      throw new Error('Invalid state, dataSource shouldn\'t be reactive');
    }

    for (const value of this.data) yield value;
  }

  * visible(inverse: boolean = false): IterableIterator<Readonly<DataSourceEntry>> {
    if (isProxy(this)) {
      throw new Error('Invalid state, dataSource shouldn\'t be reactive');
    }

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
    if (isProxy(this)) {
      throw new Error('Invalid state, dataSource shouldn\'t be reactive');
    }

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
      console.warn('Event listener not found');
      return;
    }

    this.eventListeners.splice(index, 1);
  }

  // todo store state
  public startTransaction(): void {
    this.transaction += 1;
  }

  public endTransaction(reason?: DataSourceChangeEventReason): void {
    if (this.transaction === 0) {
      throw new Error('this.transaction === 0');
    }

    if (reason !== undefined) {
      this.addReason(reason);
    }

    this.transaction -= 1;

    if (this.transaction === 0) {
      const reasons: Set<DataSourceChangeEventReason> = new Set(this.reasons);
      this.reasons.clear();

      for (const listener of this.eventListeners) {
        listener.call(listener, reasons);
      }
    }
  }

  // todo cancelTransaction
  // todo undoTransaction
  // todo redoTransaction

  public bringToFront(id: DrawingId): void {
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

  public sendToBack(id: DrawingId): void {
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

  public bringForward(id: DrawingId): void {
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

  public sendBackward(id: DrawingId): void {
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

  public cleanCache(): void {
    this.checkWeAreInTransaction();
    this.addReason(DataSourceChangeEventReason.CacheReset);

    for (const [options] of this.data) {
      options.valid = false;
    }
  }

  public remove(id: DrawingId): void {
    this.checkWeAreInTransaction();

    if (!this.has(id)) {
      console.warn(`id not found: ${id}`)
      return;
    }

    this.addReason(DataSourceChangeEventReason.RemoveEntry);

    const { data } = this;
    const index: number = this.indexById(id);
    data.splice(index, 1);
  }

  public set<T>(id: DrawingId, value: DrawingOptions<T>): void {
    this.checkWeAreInTransaction();

    const index = this.indexById(id);
    value.valid = false;
    if (index < 0) {
      this.addReason(DataSourceChangeEventReason.AddEntry);
      this.data.push([value]);
    } else {
      this.addReason(DataSourceChangeEventReason.UpdateEntry);
      this.data[index][0] = value;
    }
  }

  public get(id: DrawingId): DataSourceEntry {
    const index = this.indexById(id)
    if (index < 0) {
      throw new Error(`Unknown drawingId: ${id}`);
    }

    return this.data[index];
  }

  public update<T>(id: DrawingId, value: DeepPartial<DrawingOptions<T>>): void {
    this.checkWeAreInTransaction();

    const index = this.indexById(id);
    if (index < 0) {
      throw new Error('Illegal argument');
    } else {
      this.addReason(DataSourceChangeEventReason.UpdateEntry);
      const [options] = this.data[index];

      merge(options, value, { valid: false });
    }
  }

  // todo
  public bulkUpdate(task: DataSourceUpdateTask): void {
    this.checkWeAreInTransaction();

    console.log(task);
  }

  public has(id: DrawingId): boolean {
    return this.indexById(id) >= 0;
  }

  private checkWeAreInTransaction(): void {
    if (this.transaction <= 0) {
      throw new Error('Illegal state exception');
    }

    if (isProxy(this)) {
      throw new Error('Invalid state, dataSource shouldn\'t be reactive');
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
}
