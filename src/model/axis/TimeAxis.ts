import { merge } from '@/misc/strict-type-checks';
import type { ComputedRef, Ref } from 'vue';
import { computed, reactive, ref, watch } from 'vue';
import type { HasPostConstruct } from '@/misc/reactive-decorator';
import Axis from '@/model/axis/Axis';
import type AxisOptions from '@/model/axis/AxisOptions';
import { ZoomType } from '@/model/axis/AxisOptions';
import type { TextStyle } from '@/model/ChartStyle';
import type TVAClerk from '@/model/history/TVAClerk';
import type { UTCTimestamp, Range } from '@/model/type-defs';

export default class TimeAxis extends Axis<UTCTimestamp, AxisOptions<UTCTimestamp>> implements HasPostConstruct {
  private cache!: [/* scaleK */ number, /* unscaleK */ number];
  private requestedDataRanges: Record<string, Range<number>> = reactive({ def: { from: 0, to: 0 }});

  /**
   * This data interval should be presented in dataSource for draw particular entry, for example for Moving Average indicator
   * |<--- range.form * data.step --->|<--- timeAxis.range --->|<--- range.to * data.step --->|
   */
  public requestedDataRange: ComputedRef<Range<number>>;

  // eslint-disable-next-line no-useless-constructor
  public constructor(tvaClerk: TVAClerk, textOptions: TextStyle) {
    super('time', tvaClerk, textOptions);

    this.requestedDataRange  = computed(() => {
      const result: Range<number> = { from: 0, to: 0 };

      for (const value of Object.values(this.requestedDataRanges)) {
        if (value.from < result.from) {
          result.from = value.from;
        }

        if (value.to > result.to) {
          result.to = value.to;
        }
      }

      return result;
    });
  }

  public postConstruct(): void {
    this.invalidateCache();
  }

  public update(options: AxisOptions<UTCTimestamp>): void {
    super.update(options);

    if (options.range !== undefined || options.screenSize?.main !== undefined) {
      this.invalidateCache();
    }
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

  public requestDataRange(name: string, range: Range<number>): void {
    merge(this.requestedDataRanges, { [name]: range });
  }

  public removeDataRange(name: string): void {
    delete this.requestedDataRanges[name];
  }

  protected updateZoom(screenPivot: number, screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    if (screenSize < 0) {
      return;
    }

    const size = to - from;
    const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
    const delta = size * zoomType.valueOf();

    this.update({
      range: {
        from: from + delta as UTCTimestamp,
        to,
      },
    });
  }

  protected updateRange(screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    if (screenSize < 0) {
      return;
    }

    const size = to - from;
    const unscaleK = size / screenSize;
    const revert = (screenPos: number): UTCTimestamp => (from + unscaleK * screenPos) as UTCTimestamp;

    this.update({
      range: { from: revert(screenDelta), to: revert(screenSize + screenDelta) },
    });
  }
}
