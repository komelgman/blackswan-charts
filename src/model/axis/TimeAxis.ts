import type { HasPostConstruct } from '@/misc/reactive-decorator';
import Axis from '@/model/axis/Axis';
import type AxisOptions from '@/model/axis/AxisOptions';
import { ZoomType } from '@/model/axis/AxisOptions';
import type { TextStyle } from '@/model/ChartStyle';
import type TVAClerk from '@/model/history/TVAClerk';
import type { UTCTimestamp } from '@/model/type-defs';

// @Reactive
export default class TimeAxis extends Axis<UTCTimestamp, AxisOptions<UTCTimestamp>> implements HasPostConstruct {
  private cache!: [/* scaleK */ number, /* unscaleK */ number];

  // eslint-disable-next-line no-useless-constructor
  public constructor(tvaClerk: TVAClerk, textOptions: TextStyle) {
    super('time', tvaClerk, textOptions);
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

  protected updatePosition(screenDelta: number): void {
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
