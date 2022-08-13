import { Point, UTCTimestamp } from '@/model/type-defs';
import Axis from '@/model/axis/Axis';
import Reactive, { HasPostConstruct } from '@/misc/reactive-decorator';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { ZoomType } from '@/model/axis/scaling/ScalingFunction';
import { computed, watch } from 'vue';
import { TextStyle } from '@/model/ChartStyle';

@Reactive
export default class TimeAxis extends Axis<UTCTimestamp> implements HasPostConstruct {
  private cache!: [/* scaleK */ number, /* unscaleK */ number];

  // eslint-disable-next-line no-useless-constructor
  public constructor(textOptions: TextStyle) {
    super(textOptions);
  }

  public postConstruct(): void {
    watch([
      this.range,
      computed(() => this.screenSize.main),
    ], this.updateCache.bind(this), { immediate: true });
  }

  private updateCache(): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const size = to - from;
    const scaleK = screenSize / size;
    const unscaleK = size / screenSize;

    this.cache = [scaleK, unscaleK];
  }

  public translate(value: UTCTimestamp): number {
    const { from } = this.range;
    const [scaleK, _] = this.cache;
    return (value - from) * scaleK;
  }

  public revert(screenPos: number): UTCTimestamp {
    const { from } = this.range;
    const [_, unscaleK] = this.cache;
    return (from + unscaleK * screenPos) as UTCTimestamp;
  }

  public contextmenu(pos: Point): MenuItem[] {
    return [];
  }

  public zoom(screenPivot: number, screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    if (screenSize < 0) {
      return;
    }

    const size = to - from;
    const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
    const delta = size * zoomType.valueOf();

    this.range.from = from + delta as UTCTimestamp;
  }

  public move(screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    if (screenSize < 0) {
      return;
    }

    const size = to - from;
    const unscaleK = size / screenSize;

    const revert = (screenPos: number): UTCTimestamp => (from + unscaleK * screenPos) as UTCTimestamp;

    this.range.from = revert(screenDelta);
    this.range.to = revert(screenSize + screenDelta);
  }
}
