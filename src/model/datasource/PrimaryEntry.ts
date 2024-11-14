import { reactive, shallowReactive } from 'vue';
import type DataSource from '@/model/datasource/DataSource';
import { isEqualDrawingReference, type DrawingReference } from '@/model/datasource/types/Drawing';
import type { UTCTimestamp, Range, Price } from '@/model/chart/types';
import type { Wrapped } from '@/model/type-defs';
import { NonReactive } from '@/model/type-defs/decorators';
import { DataSourceChangeEventReason } from '@/model/datasource/events';
import { deepEqual } from '@/misc/object.deepEqual';

export declare type PrimaryEntryRef = { ds: DataSource, entryRef: DrawingReference };

@NonReactive
export class PrimaryEntry {
  private readonly preferredTimeRangeValue: Wrapped<Range<UTCTimestamp> | undefined> = reactive({ value: undefined });
  private readonly preferredPriceRangeValue: Wrapped<Range<Price> | undefined> = reactive({ value: undefined });
  private readonly entryRefValue: Wrapped<PrimaryEntryRef | undefined> = shallowReactive({ value: undefined });
  private eventListenerRemover: Function | undefined;

  public invalidate() {
    if (this.entryRefValue.value) {
      const { ds, entryRef } = this.entryRefValue.value;

      try {
        ds.noHistoryManagedEntriesProcess([entryRef], (entry) => { entry.descriptor.valid = false; });
      } catch (e) {
        if (!(e instanceof Error) || !e.message.startsWith('Illegal argument: ref not found')) {
          throw e;
        }
      }
    }
  }

  public get entryRef(): Readonly<Wrapped<PrimaryEntryRef | undefined>> {
    return this.entryRefValue;
  }

  public set entryRef(value: PrimaryEntryRef | undefined) {
    if (this.entryRefValue.value) {
      this.stopWatching();
    }

    this.entryRefValue.value = value;

    if (this.entryRefValue.value) {
      this.startWatching();
    }
  }

  public get preferredTimeRange(): Wrapped<Range<UTCTimestamp> | undefined> {
    return this.preferredTimeRangeValue;
  }

  public get preferredPriceRange(): Wrapped<Range<Price> | undefined> {
    return this.preferredPriceRangeValue;
  }

  private startWatching() {
    if (!this.entryRef.value) {
      throw new Error('Oops');
    }

    const { ds, entryRef } = this.entryRef.value;
    this.eventListenerRemover = ds.addChangeEventListener((events) => {
      const validEntryEvents = events.get(DataSourceChangeEventReason.CacheInvalidated) || [];
      const entry = validEntryEvents.find((event) => isEqualDrawingReference(event.entry.descriptor.ref, entryRef))?.entry;

      if (entry) {
        if (!deepEqual(this.preferredTimeRangeValue.value, entry.drawing?.preferred?.timeAxis)) {
          this.preferredTimeRangeValue.value = entry.drawing?.preferred?.timeAxis;
        }

        if (!deepEqual(this.preferredPriceRangeValue.value, entry.drawing?.preferred?.priceAxis)) {
          this.preferredPriceRangeValue.value = entry.drawing?.preferred?.priceAxis;
        }
      }
    });

    try {
      const entry = ds.get(entryRef);
      if (entry && entry.drawing) {
        Object.assign(this.preferredTimeRangeValue, { value: entry.drawing.preferred?.timeAxis });
        Object.assign(this.preferredPriceRangeValue, { value: entry.drawing.preferred?.priceAxis });
      }
    } catch (e) {
      if (!(e instanceof Error) || !e.message.startsWith('Illegal argument: ref not found')) {
        throw e;
      }
    }
  }

  private stopWatching() {
    if (this.eventListenerRemover) {
      this.eventListenerRemover();
      this.eventListenerRemover = undefined;
    }
  }
}
