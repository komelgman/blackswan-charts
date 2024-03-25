import { clone } from '@/misc/strict-type-checks';
import DataBinding from '@/model/databinding/DataBinding';
import type { ExternalDrawingId } from '@/model/datasource/Drawing';
import type { Range, UTCTimestamp } from '@/model/type-defs';

export interface TimeSeriesOptions<T extends object = object> {
  name: string;
  type: string;
  data: T[];
}

export default abstract class TimeSeries<T extends object = object> extends DataBinding<T[]> {
  protected readonly availableRange: Range<number> = { from: 0, to: 0 };
  protected readonly loadedRange: Range<number> = { from: 0, to: 0 };
  protected readonly requestedRanges: Map<string, Range<number>> = new Map<string, Range<number>>();
  protected readonly range: Range<number> = { from: 0, to: 0 };
  protected valid: boolean = false;

  protected constructor(options: TimeSeriesOptions<T>) {
    super(options.name, options.type, options.data);
  }

  public abstract indexToTime(i: number): UTCTimestamp;

  public abstract timeToIndex(t: UTCTimestamp): number;

  public abstract invalidate(): void;
  public requestRange(ref: ExternalDrawingId, range: Range<number>): void {
    this.requestedRanges.set(this.refToMapId(ref), range);
    this.invalidateRange();
  }

  public revokeRange(ref: ExternalDrawingId): void {
    this.requestedRanges.delete(this.refToMapId(ref));
    this.invalidateRange();
  }

  private invalidateRange(): void {
    const tmp = clone(this.range);

    for (const range of this.requestedRanges.values()) {
      if (range.from < tmp.from) {
        tmp.from = range.from;
      }

      if (range.to > tmp.to) {
        tmp.to = range.to;
      }
    }

    if (this.range.from === tmp.from && this.range.to === tmp.to) {
      return;
    }

    Object.assign(this.range, tmp);
    this.valid = false;
    this.invalidate();
  }

  private refToMapId(ref: ExternalDrawingId): string {
    return `${ref[0]}:${ref[1]}`;
  }
}
