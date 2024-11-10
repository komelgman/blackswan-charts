import { reactive } from 'vue';
import type DataSource from '@/model/datasource/DataSource';
import type { DrawingReference } from '@/model/datasource/types/Drawing';
import type { UTCTimestamp, Range, Price } from '@/model/chart/types';

export declare type PrimaryEntryRef = { ds: DataSource, entryRef: DrawingReference };

export interface PrimaryEntry {
  get timeRange(): Range<UTCTimestamp>;
  get priceRange(): Range<Price>;
}

export abstract class AbstractPrimaryEntry<DataType> implements PrimaryEntry {
  private readonly dataSource: DataSource;
  private readonly entryRef: DrawingReference;
  private readonly type: string;
  protected readonly timeRangeValue: Range<UTCTimestamp> = reactive({ from: 0 as UTCTimestamp, to: 0 as UTCTimestamp });
  protected readonly priceRangeValue: Range<Price> = reactive({ from: 0 as Price, to: 0 as Price });

  public constructor(dataSource: DataSource, entryRef: DrawingReference, type: string) {
    this.dataSource = dataSource;
    this.entryRef = entryRef;
    this.type = type;
  }

  public get timeRange(): Range<UTCTimestamp> {
    return this.timeRangeValue;
  }

  public get priceRange(): Range<Price> {
    return this.priceRangeValue;
  }

  protected get entry(): DataType {
    const result = this.dataSource.get(this.entryRef);
    if (this.type !== result.descriptor.options.type) {
      throw new Error(`IllegalState: requested type = ${this.type} but type = ${result.descriptor.options.type} found`);
    }

    return result as DataType;
  }
}
