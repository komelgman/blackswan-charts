import { toRaw } from 'vue';
import type { HasPostConstruct } from '@/model/type-defs/optional';
import Axis from '@/model/chart/axis/Axis';
import type AxisOptions from '@/model/chart/axis/AxisOptions';
import { ZoomType } from '@/model/chart/axis/AxisOptions';
import type { UTCTimestamp } from '@/model/chart/types';
import type { TextStyle } from '@/model/chart/types/styles';
import { PostConstruct } from '@/model/type-defs/decorators';
import type { HistoricalIncidentReportProcessor } from '@/model/history';

@PostConstruct
export default class TimeAxis extends Axis<UTCTimestamp, AxisOptions<UTCTimestamp>> implements HasPostConstruct {
  private cache!: [/* scaleK */ number, /* unscaleK */ number];

  public constructor(historicalIncidentReportProcessor: HistoricalIncidentReportProcessor, textOptions: TextStyle) {
    super('time', historicalIncidentReportProcessor, textOptions);
  }

  public postConstruct(): void {
    this.invalidateCache();
  }

  public noHistoryManagedUpdate(options: AxisOptions<UTCTimestamp>): void {
    super.noHistoryManagedUpdate(options);

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
    const raw = toRaw(this);
    const { from } = raw.range;
    const [scaleK] = raw.cache;
    return (value - from) * scaleK;
  }

  public revert(screenPos: number): UTCTimestamp {
    const raw = toRaw(this);
    const { from } = raw.range;
    const [, unscaleK] = raw.cache;
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

    this.noHistoryManagedUpdate({
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

    this.noHistoryManagedUpdate({
      range: { from: revert(screenDelta), to: revert(screenSize + screenDelta) },
    });
  }
}
