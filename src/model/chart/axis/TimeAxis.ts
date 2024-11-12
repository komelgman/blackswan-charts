import Axis from '@/model/chart/axis/Axis';
import { type AxisOptions, ZoomType } from '@/model/chart/axis/types';
import type { UTCTimestamp, Range } from '@/model/chart/types';
import type { TextStyle } from '@/model/chart/types/styles';
import { PostConstruct } from '@/model/type-defs/decorators';
import type { HistoricalTransactionManager } from '@/model/history';
import type { Wrapped } from '@/model/type-defs';

export interface TimeAxisOptions extends AxisOptions<UTCTimestamp> {
}

@PostConstruct
export default class TimeAxis extends Axis<UTCTimestamp, TimeAxisOptions> {
  private cache!: [/* scaleK */ number, /* unscaleK */ number];

  public constructor(historicalTransactionManager: HistoricalTransactionManager, textOptions: TextStyle) {
    super('time', historicalTransactionManager, textOptions);
  }

  public postConstruct(): void {
    super.postConstruct();
    this.invalidateCache();
  }

  public noHistoryManagedUpdate(options: TimeAxisOptions): void {
    super.noHistoryManagedUpdate(options);

    if (options.range !== undefined || options.screenSize?.main !== undefined) {
      this.invalidateCache();
    }
  }

  protected get preferredRange(): Readonly<Wrapped<Range<UTCTimestamp> | undefined>> {
    return this.primaryEntry.preferredTimeRange;
  }

  private invalidateCache(): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const size = to - from;
    const scaleK = screenSize / size;
    const unscaleK = size / screenSize;

    this.cache = [scaleK, unscaleK];
  }

  public translate(value: UTCTimestamp): number {
    const { from } = this.range;
    const [scaleK] = this.cache;
    return (value - from) * scaleK;
  }

  public revert(screenPos: number): UTCTimestamp {
    const { from } = this.range;
    const [, unscaleK] = this.cache;
    return (from + unscaleK * screenPos) as UTCTimestamp;
  }

  protected zoomInAxisRange(screenPivot: number, screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    if (screenSize < 0) {
      return;
    }

    const size = to - from;
    const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
    const delta = size * zoomType.valueOf();

    this.noHistoryManagedUpdate({
      range: {
        from: from + delta as UTCTimestamp,
        to,
      },
    });
  }

  protected moveAxisRangeByDelta(screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    if (screenSize < 0) {
      return;
    }

    const size = to - from;
    const unscaleK = size / screenSize;
    const revert = (screenPos: number): UTCTimestamp => (from + unscaleK * screenPos) as UTCTimestamp;

    this.noHistoryManagedUpdate({
      range: { from: revert(screenDelta), to: revert(screenSize + screenDelta) },
    });
  }
}
